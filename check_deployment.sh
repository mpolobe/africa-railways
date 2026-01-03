#!/bin/bash
echo "Verifying Africoin Deployment..."
echo "Package ID: $AFC_PACKAGE_ID"
sui client object $AFC_PACKAGE_ID --json | grep "owner"
