def parse_credits_input(credits_single_input):
    roles = []
    names = []
    favs = []
    
    if not credits_single_input or not credits_single_input.strip():
        return roles, names, favs
    
    credit_pairs = credits_single_input.split(',')
    
    for pair in credit_pairs:
        pair = pair.strip()
        if ':' in pair:
            parts = pair.split(':', 1)
            name = parts[0].strip()
            role = parts[1].strip()
            
            if name and role:
                names.append(name)
                roles.append(role)
                favs.append('off')
    
    return roles, names, favs