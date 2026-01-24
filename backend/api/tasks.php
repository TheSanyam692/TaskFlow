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
    $sql = "SELECT * FROM tasks ORDER BY created_at DESC";
    $result = $conn->query($sql);
    
    $tasks = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            // Convert snake_case to camelCase for frontend
            $row['createdAt'] = $row['created_at'];
            $row['updatedAt'] = $row['updated_at'];
            unset($row['created_at'], $row['updated_at']);
            $tasks[] = $row;
        }
    }
    
    sendResponse($tasks);
}

function handlePost($conn) {
    $data = getJsonInput();
    
    if (!isset($data['title'])) {
        sendResponse(['success' => false, 'message' => 'Title is required'], 400);
    }
    
    $id = isset($data['id']) ? $data['id'] : uniqid();
    $title = $data['title'];
    $description = $data['description'] ?? '';
    $assignee = $data['assignee'] ?? '';
    $status = $data['status'] ?? 'todo';
    $priority = $data['priority'] ?? 'medium';
    $deadline = !empty($data['deadline']) ? $data['deadline'] : null;
    
    $stmt = $conn->prepare("INSERT INTO tasks (id, title, description, assignee, status, priority, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssss", $id, $title, $description, $assignee, $status, $priority, $deadline);
    
    if ($stmt->execute()) {
        // Fetch the created task to return it
        $sql = "SELECT * FROM tasks WHERE id = '$id'";
        $result = $conn->query($sql);
        $task = $result->fetch_assoc();
        
        // Format for frontend
        $task['createdAt'] = $task['created_at'];
        $task['updatedAt'] = $task['updated_at'];
        unset($task['created_at'], $task['updated_at']);
        
        sendResponse(['success' => true, 'task' => $task], 201);
    } else {
        sendResponse(['success' => false, 'message' => 'Failed to create task: ' . $stmt->error], 500);
    }
    
    $stmt->close();
}

function handlePut($conn) {
    $data = getJsonInput();
    
    if (!isset($data['id'])) {
        sendResponse(['success' => false, 'message' => 'ID is required'], 400);
    }
    
    $id = $data['id'];
    
    // Build dynamic update query
    $fields = [];
    $types = "";
    $values = [];
    
    if (isset($data['title'])) { $fields[] = "title=?"; $types .= "s"; $values[] = $data['title']; }
    if (isset($data['description'])) { $fields[] = "description=?"; $types .= "s"; $values[] = $data['description']; }
    if (isset($data['assignee'])) { $fields[] = "assignee=?"; $types .= "s"; $values[] = $data['assignee']; }
    if (isset($data['status'])) { $fields[] = "status=?"; $types .= "s"; $values[] = $data['status']; }
    if (isset($data['priority'])) { $fields[] = "priority=?"; $types .= "s"; $values[] = $data['priority']; }
    if (array_key_exists('deadline', $data)) { 
        $fields[] = "deadline=?"; 
        $types .= "s"; 
        $values[] = !empty($data['deadline']) ? $data['deadline'] : null; 
    }
    
    if (empty($fields)) {
        sendResponse(['success' => false, 'message' => 'No fields to update'], 400);
    }
    
    $sql = "UPDATE tasks SET " . implode(", ", $fields) . " WHERE id=?";
    $types .= "s";
    $values[] = $id;
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$values);
    
    if ($stmt->execute()) {
         if ($stmt->affected_rows === 0) {
             // Check if task exists
             $check = $conn->query("SELECT id FROM tasks WHERE id = '$id'");
             if ($check->num_rows === 0) {
                 sendResponse(['success' => false, 'message' => 'Task not found'], 404);
             }
         }
         
        // Return updated task
        $result = $conn->query("SELECT * FROM tasks WHERE id = '$id'");
        $task = $result->fetch_assoc();
        
        $task['createdAt'] = $task['created_at'];
        $task['updatedAt'] = $task['updated_at'];
        unset($task['created_at'], $task['updated_at']);
        
        sendResponse(['success' => true, 'task' => $task]);
    } else {
        sendResponse(['success' => false, 'message' => 'Failed to update task: ' . $stmt->error], 500);
    }
    
    $stmt->close();
}

function handleDelete($conn) {
    if (!isset($_GET['id'])) {
        sendResponse(['success' => false, 'message' => 'ID is required'], 400);
    }
    
    $id = $_GET['id'];
    
    $stmt = $conn->prepare("DELETE FROM tasks WHERE id = ?");
    $stmt->bind_param("s", $id);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            sendResponse(['success' => true, 'message' => 'Task deleted']);
        } else {
            sendResponse(['success' => false, 'message' => 'Task not found'], 404);
        }
    } else {
        sendResponse(['success' => false, 'message' => 'Failed to delete task: ' . $stmt->error], 500);
    }
    
    $stmt->close();
}
?>
