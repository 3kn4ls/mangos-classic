#!/bin/bash

# Quick restart script - when you just need to restart without rebuilding
# Use this after pulling code changes to force-reload the API

set -e

NAMESPACE="mangos-classic"
DEPLOYMENT_NAME="admin-api"

echo "♻️  Restarting Admin API..."

# Method 1: Rollout restart (preferred)
kubectl rollout restart deployment/$DEPLOYMENT_NAME -n $NAMESPACE

echo "⏳ Waiting for pods to restart..."
kubectl rollout status deployment/$DEPLOYMENT_NAME -n $NAMESPACE --timeout=2m

echo "✓ Pods restarted successfully!"
echo ""
echo "Current pods:"
kubectl get pods -n $NAMESPACE -l app=$DEPLOYMENT_NAME

echo ""
echo "📋 Recent logs:"
kubectl logs -n $NAMESPACE -l app=$DEPLOYMENT_NAME --tail=10
