# Cloud SDK Setup for Dashboard Controls

## Overview
The OCC Dashboard can control cloud infrastructure (GCP Compute Engine and AWS EC2) directly from the web interface. This requires installing the official cloud SDKs.

## Installation Steps

### 1. Install GCP SDK (for Compute Engine control)

```bash
cd /workspaces/africa-railways/dashboard
go get cloud.google.com/go/compute/apiv1
go get cloud.google.com/go/compute/apiv1/computepb
```

### 2. Install AWS SDK (for EC2 control)

```bash
cd /workspaces/africa-railways/dashboard
go get github.com/aws/aws-sdk-go-v2/config
go get github.com/aws/aws-sdk-go-v2/service/ec2
```

### 3. Update go.mod

```bash
cd /workspaces/africa-railways/dashboard
go mod tidy
```

## Configuration

### GCP Authentication

Set up GCP credentials:

```bash
# Option 1: Service Account Key
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"

# Option 2: gcloud CLI (for development)
gcloud auth application-default login
```

Set environment variables:

```bash
export GCP_PROJECT_ID="your-project-id"
export GCP_ZONE="us-central1-a"
```

### AWS Authentication

Set up AWS credentials:

```bash
# Option 1: AWS CLI configuration
aws configure

# Option 2: Environment variables
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="us-east-1"
```

## Usage

### API Endpoints

**GCP Control:**
```bash
# Start instance
curl -X POST http://localhost:8080/api/control/gcp \
  -d "instance=relayer-instance&action=start"

# Stop instance
curl -X POST http://localhost:8080/api/control/gcp \
  -d "instance=relayer-instance&action=stop"
```

**AWS Control:**
```bash
# Start instance
curl -X POST http://localhost:8080/api/control/aws \
  -d "id=i-1234567890abcdef0&action=start"

# Stop instance
curl -X POST http://localhost:8080/api/control/aws \
  -d "id=i-1234567890abcdef0&action=stop"
```

## Implementation Options

### Current Implementation (CLI-based)
The dashboard currently uses CLI commands (`gcloud` and `aws`) for simplicity. This requires:
- `gcloud` CLI installed and authenticated
- `aws` CLI installed and configured

**Pros:**
- Simple implementation
- No additional Go dependencies
- Works immediately if CLIs are configured

**Cons:**
- Requires CLI tools installed
- Less efficient than native SDK calls
- Limited error handling

### Production Implementation (SDK-based)
For production, uncomment the SDK-based implementations in `main.go`:

**GCP SDK Implementation:**
```go
import (
    compute "cloud.google.com/go/compute/apiv1"
    computepb "cloud.google.com/go/compute/apiv1/computepb"
)

func handleGCPControlSDK(w http.ResponseWriter, r *http.Request) {
    ctx := context.Background()
    client, err := compute.NewInstancesRESTClient(ctx)
    if err != nil {
        // handle error
    }
    defer client.Close()

    req := &computepb.StartInstanceRequest{
        Project:  projectID,
        Zone:     zone,
        Instance: instanceName,
    }
    
    op, err := client.Start(ctx, req)
    if err != nil {
        // handle error
    }
    
    if err = op.Wait(ctx); err != nil {
        // handle error
    }
}
```

**AWS SDK Implementation:**
```go
import (
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/ec2"
)

func handleAWSControlSDK(w http.ResponseWriter, r *http.Request) {
    ctx := context.Background()
    cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion(region))
    if err != nil {
        // handle error
    }

    client := ec2.NewFromConfig(cfg)
    
    input := &ec2.StartInstancesInput{
        InstanceIds: []string{instanceID},
    }
    
    result, err := client.StartInstances(ctx, input)
    if err != nil {
        // handle error
    }
}
```

**Pros:**
- Native Go implementation
- Better error handling
- More efficient
- Production-ready

**Cons:**
- Larger binary size
- More dependencies
- Requires proper IAM permissions

## Security Considerations

### IAM Permissions

**GCP Service Account needs:**
- `compute.instances.start`
- `compute.instances.stop`
- `compute.instances.get`

**AWS IAM Policy needs:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:DescribeInstances"
      ],
      "Resource": "*"
    }
  ]
}
```

### Dashboard Authentication

In production, add authentication to the dashboard:

```go
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // Check API key or JWT token
        apiKey := r.Header.Get("X-API-Key")
        if apiKey != os.Getenv("DASHBOARD_API_KEY") {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }
        next(w, r)
    }
}

// Protect control endpoints
mux.HandleFunc("/api/control/gcp", authMiddleware(handleGCPControl))
mux.HandleFunc("/api/control/aws", authMiddleware(handleAWSControl))
```

## Testing

### Test GCP Control (without actual instances)

```bash
# Dry run - check credentials
gcloud compute instances list --project=$GCP_PROJECT_ID --zone=$GCP_ZONE
```

### Test AWS Control (without actual instances)

```bash
# Dry run - check credentials
aws ec2 describe-instances --region=$AWS_REGION
```

## Troubleshooting

### GCP Issues

**Error: "Could not find default credentials"**
```bash
gcloud auth application-default login
```

**Error: "Permission denied"**
- Check service account has `compute.instances.start/stop` permissions
- Verify `GCP_PROJECT_ID` and `GCP_ZONE` are correct

### AWS Issues

**Error: "Unable to locate credentials"**
```bash
aws configure
# Or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
```

**Error: "UnauthorizedOperation"**
- Check IAM policy includes `ec2:StartInstances` and `ec2:StopInstances`
- Verify instance ID is correct

## Next Steps

1. Install cloud SDKs (see Installation Steps above)
2. Configure authentication (GCP and/or AWS)
3. Set environment variables
4. Test with CLI commands first
5. Integrate with dashboard UI
6. For production: Switch to SDK-based implementations
