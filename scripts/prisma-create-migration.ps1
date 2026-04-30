param( 
    [Parameter(Mandatory = $true)] 
    [ValidateSet('users', 'orders', 'notifications', 'analytics')] 
    [string]$Service, 
 
    [Parameter(Mandatory = $true)] 
    [string]$Name 
) 
 
$ErrorActionPreference = 'Stop' 
 
switch ($Service) { 
    'users' { 
        $schema = 'apps/users/prisma/schema.prisma' 
        $exportVar = 'USERS_DATABASE_URL' 
    } 
    'orders' { 
        $schema = 'apps/orders/prisma/schema.prisma' 
        $exportVar = 'ORDERS_DATABASE_URL' 
    } 
    'notifications' { 
        $schema = 'apps/notifications/prisma/schema.prisma' 
        $exportVar = 'NOTIFICATIONS_DATABASE_URL' 
    } 
    'analytics' { 
        $schema = 'apps/analytics/prisma/schema.prisma' 
        $exportVar = 'ANALYTICS_DATABASE_URL' 
    } 
} 
 
Write-Host "Creating Prisma migration '$Name' for service '$Service' (inside Docker network)..." -ForegroundColor Cyan 
 
$innerCommand = "export $exportVar=`$DATABASE_URL && npx prisma migrate dev --schema=$schema --name $Name --create-only" 
 
docker compose run --rm --entrypoint sh $Service -lc $innerCommand 
 
if ($LASTEXITCODE -ne 0) { 
    throw "Migration creation failed for service '$Service'." 
} 
 
Write-Host "Migration created for '$Service'." -ForegroundColor Green