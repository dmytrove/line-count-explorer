@echo off
cd /d C:\github\line-count-explorer\line-count-explorer
git init
git add .
git config --global user.name "Dmytro Yemelianov"
git config --global user.email "dmytro@dmytrove.com"
git commit -m "feat: Initial project structure for Line Count Explorer

- Created TypeScript modules for line counting
- Added configuration management
- Implemented decoration provider
- Created README and documentation
- Set up basic test framework
- Added GitHub Actions workflow"
pause