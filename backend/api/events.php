<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet($conn);
        break;
    case 'POST':
        handlePost($conn);
        break;
    case 'PUT':
        handlePut($conn);
        break;
    case 'DELETE':
        handleDelete($conn);
        break;
    default:
        sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

function handleGet($conn) {
    $sql = "SELECT * FROM events ORDER BY event_date ASC, start_time ASC";
    $result = $conn->query($sql);
    
    $events = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            // Map DB columns to Frontend properties
            $row['date'] = $row['event_date'];
            $row['startTime'] = $row['start_time'];
            $row['endTime'] = $row['end_time'];
            $row['createdAt'] = $row['created_at'];
            $row['updatedAt'] = $row['updated_at'];
            
            // Remove DB specific columns that are renamed
            unset($row['event_date'], $row['start_time'], $row['end_time'], $row['created_at'], $row['updated_at']);
            
            $events[] = $row;
        }
    }
    
    sendResponse($events);
}

function handlePost($conn) {
    $data = getJsonInput();
    
    if (!isset($data['title']) || !isset($data['date'])) {
        sendResponse(['success' => false, 'message' => 'Title and Date are required'], 400);
    }
    
    $id = isset($data['id']) ? $data['id'] : uniqid();
    $title = $data['title'];
    $description = $data['description'] ?? '';
    $date = $data['date'];
    $startTime = !empty($data['startTime']) ? $data['startTime'] : null;
    $endTime = !empty($data['endTime']) ? $data['endTime'] : null;
    $location = $data['location'] ?? '';
    $color = $data['color'] ?? 'hsl(260, 70%, 55%)';
    $reminder = $data['reminder'] ?? 'none';
    
    $stmt = $conn->prepare("INSERT INTO events (id, title, description, event_date, start_time, end_time, location, color, reminder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssssss", $id, $title, $description, $date, $startTime, $endTime, $location, $color, $reminder);
    
    if ($stmt->execute()) {
        // Return created event
        $sql = "SELECT * FROM events WHERE id = '$id'";
        $result = $conn->query($sql);
        $row = $result->fetch_assoc();
        
        $row['date'] = $row['event_date'];
        $row['startTime'] = $row['start_time'];
        $row['endTime'] = $row['end_time'];
        $row['createdAt'] = $row['created_at'];
        $row['updatedAt'] = $row['updated_at'];
        unset($row['event_date'], $row['start_time'], $row['end_time'], $row['created_at'], $row['updated_at']);
        
        sendResponse(['success' => true, 'event' => $row], 201);
    } else {
        sendResponse(['success' => false, 'message' => 'Failed to create event: ' . $stmt->error], 500);
    }
    
    $stmt->close();
}

function handlePut($conn) {
    $data = getJsonInput();
    
    if (!isset($data['id'])) {
        sendResponse(['success' => false, 'message' => 'ID is required'], 400);
    }
    
    $id = $data['id'];
    
    // Build dynamic update
    $fields = [];
    $types = "";
    $values = [];
    
    if (isset($data['title'])) { $fields[] = "title=?"; $types .= "s"; $values[] = $data['title']; }
    if (isset($data['description'])) { $fields[] = "description=?"; $types .= "s"; $values[] = $data['description']; }
    if (isset($data['date'])) { $fields[] = "event_date=?"; $types .= "s"; $values[] = $data['date']; }
    if (array_key_exists('startTime', $data)) { 
        $fields[] = "start_time=?"; 
        $types .= "s"; 
        $values[] = !empty($data['startTime']) ? $data['startTime'] : null; 
    }
    if (array_key_exists('endTime', $data)) { 
        $fields[] = "end_time=?"; 
        $types .= "s"; 
        $values[] = !empty($data['endTime']) ? $data['endTime'] : null; 
    }
    if (isset($data['location'])) { $fields[] = "location=?"; $types .= "s"; $values[] = $data['location']; }
    if (isset($data['color'])) { $fields[] = "color=?"; $types .= "s"; $values[] = $data['color']; }
    if (isset($data['reminder'])) { $fields[] = "reminder=?"; $types .= "s"; $values[] = $data['reminder']; }
    
    if (empty($fields)) {
        sendResponse(['success' => false, 'message' => 'No fields to update'], 400);
    }
    
    $sql = "UPDATE events SET " . implode(", ", $fields) . " WHERE id=?";
    $types .= "s";
    $values[] = $id;
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$values);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows === 0) {
             // Check if exists
             $check = $conn->query("SELECT id FROM events WHERE id = '$id'");
             if ($check->num_rows === 0) {
                 sendResponse(['success' => false, 'message' => 'Event not found'], 404);
             }
         }
         
        // Return updated event
        $result = $conn->query("SELECT * FROM events WHERE id = '$id'");
        $row = $result->fetch_assoc();
        
        $row['date'] = $row['event_date'];
        $row['startTime'] = $row['start_time'];
        $row['endTime'] = $row['end_time'];
        $row['createdAt'] = $row['created_at'];
        $row['updatedAt'] = $row['updated_at'];
        unset($row['event_date'], $row['start_time'], $row['end_time'], $row['created_at'], $row['updated_at']);
        
        sendResponse(['success' => true, 'event' => $row]);
    } else {
        sendResponse(['success' => false, 'message' => 'Failed to update event: ' . $stmt->error], 500);
    }
    
    $stmt->close();
}

function handleDelete($conn) {
    if (!isset($_GET['id'])) {
        sendResponse(['success' => false, 'message' => 'ID is required'], 400);
    }
    
    $id = $_GET['id'];
    
    $stmt = $conn->prepare("DELETE FROM events WHERE id = ?");
    $stmt->bind_param("s", $id);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            sendResponse(['success' => true, 'message' => 'Event deleted']);
        } else {
            sendResponse(['success' => false, 'message' => 'Event not found'], 404);
        }
    } else {
        sendResponse(['success' => false, 'message' => 'Failed to delete event: ' . $stmt->error], 500);
    }
    
    $stmt->close();
}
?>
