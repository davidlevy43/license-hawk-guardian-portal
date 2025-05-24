
@echo off
echo Stopping License Manager...
docker-compose down

echo Removing unused Docker resources...
docker system prune -f

echo License Manager stopped successfully.
pause
