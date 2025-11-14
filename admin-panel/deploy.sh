#!/bin/bash

# Admin Panel API - Deployment Script
# This script rebuilds the Docker image and restarts the Kubernetes deployment

set -e  # Exit on any error

echo "🚀 Deploying Admin Panel API Updates..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="mangos-classic"
DEPLOYMENT_NAME="admin-api"
IMAGE_NAME="mangos-classic/admin-api"
IMAGE_TAG="latest"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$SCRIPT_DIR/api"

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl not found. Please install kubectl first."
fi

# Check if we're in the correct directory
if [ ! -d "$API_DIR" ]; then
    print_error "API directory not found at: $API_DIR"
fi

echo "📁 Working directory: $API_DIR"
cd "$API_DIR"

# Step 1: Build Docker image
echo ""
echo "🔨 Building Docker image..."
docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" . || print_error "Docker build failed"
print_success "Docker image built successfully"

# Step 2: Tag image with timestamp (for rollback capability)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
docker tag "${IMAGE_NAME}:${IMAGE_TAG}" "${IMAGE_NAME}:${TIMESTAMP}"
print_success "Image tagged with timestamp: ${TIMESTAMP}"

# Step 3: For k3s/local clusters, import image
if command -v k3s &> /dev/null; then
    echo ""
    echo "📦 Importing image to k3s..."
    docker save "${IMAGE_NAME}:${IMAGE_TAG}" | sudo k3s ctr images import - || print_warning "Could not import to k3s"
    print_success "Image imported to k3s"
fi

# Step 4: Restart Kubernetes deployment
echo ""
echo "♻️  Restarting Kubernetes deployment..."

# Check if namespace exists
if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
    print_error "Namespace '$NAMESPACE' not found"
fi

# Check if deployment exists
if ! kubectl get deployment "$DEPLOYMENT_NAME" -n "$NAMESPACE" &> /dev/null; then
    print_error "Deployment '$DEPLOYMENT_NAME' not found in namespace '$NAMESPACE'"
fi

# Restart the deployment
kubectl rollout restart deployment/"$DEPLOYMENT_NAME" -n "$NAMESPACE" || print_error "Failed to restart deployment"
print_success "Deployment restart initiated"

# Step 5: Wait for rollout to complete
echo ""
echo "⏳ Waiting for rollout to complete..."
kubectl rollout status deployment/"$DEPLOYMENT_NAME" -n "$NAMESPACE" --timeout=5m || print_error "Rollout failed or timed out"
print_success "Rollout completed successfully"

# Step 6: Get pod status
echo ""
echo "📊 Current pod status:"
kubectl get pods -n "$NAMESPACE" -l app="$DEPLOYMENT_NAME"

# Step 7: Test endpoints
echo ""
echo "🧪 Testing endpoints..."

# Get the service port
API_URL=$(kubectl get ingress -n "$NAMESPACE" -o jsonpath='{.items[0].spec.rules[0].host}' 2>/dev/null)
if [ -z "$API_URL" ]; then
    # Fallback to port-forward for testing
    print_warning "Could not get ingress URL, using port-forward for testing..."
    kubectl port-forward -n "$NAMESPACE" svc/admin-api-service 3000:3000 &
    PF_PID=$!
    sleep 3
    API_URL="localhost:3000"
else
    API_URL="https://${API_URL}/cmangos"
fi

# Test health endpoint
echo "Testing: ${API_URL}/api/health"
if curl -s -f "${API_URL}/api/health" > /dev/null; then
    print_success "Health check passed"
else
    print_warning "Health check failed (service might still be starting)"
fi

# Test new endpoints
echo "Testing new endpoints..."
test_endpoint() {
    local endpoint=$1
    local name=$2
    echo -n "  - ${name}: "
    if curl -s -f "${API_URL}${endpoint}" > /dev/null 2>&1; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FAIL${NC}"
    fi
}

test_endpoint "/api/skills/search?q=sword" "Skills"
test_endpoint "/api/reputations/search?q=stormwind" "Reputations"
test_endpoint "/api/spells/search?q=fire" "Spells"
test_endpoint "/api/quests/search?q=lost" "Quests"
test_endpoint "/api/accounts" "Accounts"

# Kill port-forward if it was started
if [ ! -z "$PF_PID" ]; then
    kill $PF_PID 2>/dev/null || true
fi

# Step 8: Show logs
echo ""
echo "📋 Recent logs (last 20 lines):"
kubectl logs -n "$NAMESPACE" -l app="$DEPLOYMENT_NAME" --tail=20 --prefix=true

echo ""
print_success "Deployment completed successfully! 🎉"
echo ""
echo "📝 Deployed image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo "📝 Backup image: ${IMAGE_NAME}:${TIMESTAMP}"
echo ""
echo "To view logs in real-time:"
echo "  kubectl logs -f -n $NAMESPACE -l app=$DEPLOYMENT_NAME"
echo ""
echo "To rollback if needed:"
echo "  kubectl rollout undo deployment/$DEPLOYMENT_NAME -n $NAMESPACE"
echo ""
