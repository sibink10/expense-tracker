@description('Base name')
param appName string = 'qubiqon-finance'
param location string = resourceGroup().location
@secure() param sqlAdminUser string
@secure() param sqlAdminPassword string
param entraIdTenantId string
param entraIdClientId string

var suffix = uniqueString(resourceGroup().id)
var webAppName = '${appName}-api-${suffix}'
var sqlServerName = '${appName}-sql-${suffix}'

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${appName}-logs'
  location: location
  properties: { sku: { name: 'PerGB2018' }, retentionInDays: 30 }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${appName}-insights'
  location: location
  kind: 'web'
  properties: { Application_Type: 'web', WorkspaceResourceId: logAnalytics.id }
}

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${appName}-plan'
  location: location
  kind: 'linux'
  sku: { name: 'B1', tier: 'Basic' }
  properties: { reserved: true }
}

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|9.0'
      alwaysOn: true
      appSettings: [
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
        { name: 'AzureAd__TenantId', value: entraIdTenantId }
        { name: 'AzureAd__ClientId', value: entraIdClientId }
      ]
      connectionStrings: [
        { name: 'DefaultConnection', connectionString: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=QubiqonFinanceHub;User ID=${sqlAdminUser};Password=${sqlAdminPassword};Encrypt=True;', type: 'SQLAzure' }
      ]
    }
  }
}

resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: sqlServerName
  location: location
  properties: { administratorLogin: sqlAdminUser, administratorLoginPassword: sqlAdminPassword, version: '12.0', minimalTlsVersion: '1.2' }
}

resource sqlFw 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = {
  parent: sqlServer
  name: 'AllowAzure'
  properties: { startIpAddress: '0.0.0.0', endIpAddress: '0.0.0.0' }
}

resource sqlDb 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sqlServer
  name: 'QubiqonFinanceHub'
  location: location
  sku: { name: 'GP_S_Gen5', tier: 'GeneralPurpose', family: 'Gen5', capacity: 2 }
  properties: { collation: 'SQL_Latin1_General_CP1_CI_AS', autoPauseDelay: 60, minCapacity: json('0.5') }
}

output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output sqlFqdn string = sqlServer.properties.fullyQualifiedDomainName
