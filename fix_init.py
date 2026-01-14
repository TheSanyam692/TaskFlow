import os
import re

# Files to process
files = [
    'js/taskManager.js',
    'js/taskUI.js',
    'js/eventScheduler.js',
    'js/calendarUI.js',
    'js/notifications.js'
]

for filepath in files:
    full_path = os.path.join(r'..\projects\TaskFlow', filepath)
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove the auto-initialization block
    # Pattern: from "// Auto-initialize" to just before "// Export"
    pattern = r'// Auto-initialize\r?\nif \(document\.readyState === \'loading\'\) \{\r?\n    document\.addEventListener\(\'DOMContentLoaded\', \(\) => .*?\.init\(\)\);\r?\n\} else \{\r?\n    .*?\.init\(\);\r?\n\}\r?\n\r?\n'
    
    content = re.sub(pattern, '', content)
    
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f'Processed: {filepath}')

print('Done!')
