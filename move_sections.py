import re

with open('src/components/dashboard/HomeDashboardView.tsx', 'r') as f:
    content = f.read()

# Find the start of Popular Tickets
pt_start = content.find('                            {/* Popular Tickets */}')
# Find the end of News & Injuries
ni_end = content.find('                                </div>\n                            </section>', pt_start) + len('                                </div>\n                            </section>')

if pt_start != -1 and ni_end != -1:
    # the block to move
    block_to_move = content[pt_start:ni_end]
    
    # remove the block from original and the trailing newline/spaces
    content = content[:pt_start] + content[ni_end:]
    
    # change grid-cols-1 md:grid-cols-2 to grid-cols-1 in the block
    block_to_move = block_to_move.replace('grid-cols-1 md:grid-cols-2 gap-4', 'grid-cols-1 gap-4')
    
    # find where to insert it: after {/* RIGHT COLUMN: AI Parlays */} and <div className="space-y-6">
    insert_target = '{/* RIGHT COLUMN: AI Parlays */}\n                        <div className="space-y-6">'
    insert_idx = content.find(insert_target) + len(insert_target)
    
    if insert_idx != -1 + len(insert_target):
        # insert it
        content = content[:insert_idx] + '\n' + block_to_move + content[insert_idx:]
        
        with open('src/components/dashboard/HomeDashboardView.tsx', 'w') as f:
            f.write(content)
        print("Successfully moved sections.")
    else:
        print("Could not find insert target.")
else:
    print("Could not find block to move.")
