#!/bin/bash

# Troubleshooting script for Admin Panel API issues

NAMESPACE="mangos-classic"
DEPLOYMENT_NAME="admin-api"

echo "🔍 Admin Panel API Troubleshooting"
echo "=================================="
echo ""

# Check namespace
echo "1. Checking namespace..."
if kubectl get namespace $NAMESPACE &> /dev/null; then
    echo "   ✓ Namespace '$NAMESPACE' exists"
else
    echo "   ✗ Namespace '$NAMESPACE' NOT FOUND"
    exit 1
fi
echo ""

# Check deployment
echo "2. Checking deployment..."
if kubectl get deployment $DEPLOYMENT_NAME -n $NAMESPACE &> /dev/null; then
    echo "   ✓ Deployment '$DEPLOYMENT_NAME' exists"
    kubectl get deployment $DEPLOYMENT_NAME -n $NAMESPACE
else
    echo "   ✗ Deployment '$DEPLOYMENT_NAME' NOT FOUND"
    exit 1
fi
echo ""

# Check pods
echo "3. Checking pods..."
PODS=$(kubectl get pods -n $NAMESPACE -l app=$DEPLOYMENT_NAME --no-headers 2>/dev/null)
if [ -z "$PODS" ]; then
    echo "   ✗ No pods found for app=$DEPLOYMENT_NAME"
else
    echo "$PODS"

    # Check pod status
    NOT_RUNNING=$(echo "$PODS" | grep -v "Running" | wc -l)
    if [ $NOT_RUNNING -gt 0 ]; then
        echo "   ⚠ Some pods are not running!"
    fi
fi
echo ""

# Check services
echo "4. Checking services..."
kubectl get svc -n $NAMESPACE | grep admin-api
echo ""

# Check ingress
echo "5. Checking ingress..."
kubectl get ingress -n $NAMESPACE
echo ""

# Check recent events
echo "6. Recent events..."
kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' | tail -20
echo ""

# Check pod logs
echo "7. Recent pod logs (last 30 lines)..."
kubectl logs -n $NAMESPACE -l app=$DEPLOYMENT_NAME --tail=30 --prefix=true
echo ""

# Test database connectivity
echo "8. Testing database connectivity from pod..."
POD_NAME=$(kubectl get pods -n $NAMESPACE -l app=$DEPLOYMENT_NAME -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [ ! -z "$POD_NAME" ]; then
    echo "   Testing from pod: $POD_NAME"
    kubectl exec -n $NAMESPACE $POD_NAME -- node -e "
        const mysql = require('mysql2/promise');
        const config = {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.REALMD_DB
        };
        mysql.createConnection(config)
            .then(() => console.log('   ✓ Database connection successful'))
            .catch(err => console.log('   ✗ Database connection failed:', err.message));
    " 2>/dev/null || echo "   ⚠ Could not test database connection"
else
    echo "   ⚠ No running pod found to test from"
fi
echo ""

# Check if routes files exist in pod
echo "9. Checking route files in pod..."
if [ ! -z "$POD_NAME" ]; then
    echo "   Checking files in pod..."
    kubectl exec -n $NAMESPACE $POD_NAME -- ls -la /app/routes/ 2>/dev/null || echo "   ⚠ Could not list route files"
else
    echo "   ⚠ No running pod found"
fi
echo ""

# Test endpoints
echo "10. Testing API endpoints..."
API_URL=$(kubectl get ingress -n $NAMESPACE -o jsonpath='{.items[0].spec.rules[0].host}' 2>/dev/null)
if [ ! -z "$API_URL" ]; then
    echo "   Using URL: https://${API_URL}/cmangos/api"

    test_endpoint() {
        local path=$1
        local name=$2
        echo -n "   - ${name}: "
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://${API_URL}/cmangos/api${path}" 2>/dev/null)
        if [ "$HTTP_CODE" = "200" ]; then
            echo "✓ OK (200)"
        else
            echo "✗ FAIL (${HTTP_CODE})"
        fi
    }

    test_endpoint "/health" "Health"
    test_endpoint "/skills/search?q=sword" "Skills"
    test_endpoint "/reputations/search?q=storm" "Reputations"
    test_endpoint "/accounts" "Accounts"
else
    echo "   ⚠ Could not determine ingress URL"
fi
echo ""

echo "=================================="
echo "🏁 Troubleshooting Complete"
echo ""
echo "Common fixes:"
echo "  1. Rebuild and redeploy: ./deploy.sh"
echo "  2. Quick restart: ./quick-restart.sh"
echo "  3. Check pod logs: kubectl logs -f -n $NAMESPACE -l app=$DEPLOYMENT_NAME"
echo "  4. Describe pod: kubectl describe pod -n $NAMESPACE -l app=$DEPLOYMENT_NAME"
echo "  5. Exec into pod: kubectl exec -it -n $NAMESPACE \$(kubectl get pod -n $NAMESPACE -l app=$DEPLOYMENT_NAME -o jsonpath='{.items[0].metadata.name}') -- sh"
