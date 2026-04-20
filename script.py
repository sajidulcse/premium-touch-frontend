import sys

def fix_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        c = f.read()
        
    c = c.replace('ProjectManager', 'PortfolioManager')
    c = c.replace('ProjectEditor', 'PortfolioEditor')
    c = c.replace('ProjectImage', 'PortfolioImage')
    c = c.replace('Project', 'Portfolio')
    c = c.replace('project', 'portfolio')
    c = c.replace('projects', 'portfolios')
    c = c.replace('Projects', 'Portfolios')
    c = c.replace('/admin-portfolios/new', '/admin/portfolios/new')
    c = c.replace('/admin-portfolios/edit/', '/admin/portfolios/edit/')
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(c)

fix_file('src/pages/Admin/PortfolioManager.jsx')
fix_file('src/pages/Admin/PortfolioEditor.jsx')
print("Done")
