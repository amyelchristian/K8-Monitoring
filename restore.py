import json

log_path = "/Users/amyelchistian/.gemini/antigravity-ide/brain/9f9d0fdd-0aad-45f3-8aed-2302a14828e7/.system_generated/logs/transcript.jsonl"
original_contents = {}

with open(log_path, 'r') as f:
    for line in f:
        try:
            entry = json.loads(line)
            if 'tool_calls' in entry:
                for call in entry['tool_calls']:
                    if call.get('name') == 'replace_file_content':
                        args = call.get('args', {})
                        target_file = args.get('TargetFile')
                        if target_file and target_file.startswith('"/Users/amyelchistian/Desktop/Hackathons/Faraway x Japan/Project/dashboard/src/'):
                            target_file = json.loads(target_file)
                        elif target_file:
                            # It might not be double quoted in the args dict if it's already parsed
                            pass

                        target_file = args.get('TargetFile', '').strip('"')
                        target_content = args.get('TargetContent')
                        if target_file and target_content:
                            if target_file not in original_contents:
                                original_contents[target_file] = target_content.strip('"').encode('utf-8').decode('unicode_escape')
        except Exception as e:
            pass

for fpath, content in original_contents.items():
    if "<truncated" in content:
        print(f"TRUNCATED: {fpath}")
    else:
        print(f"Restoring: {fpath}")
        with open(fpath, 'w') as out:
            out.write(content)
