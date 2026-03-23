# Rolling Update Guide

## 1. Build version 2
```bash
cp public/index-v2.html public/index.html
docker build . -t us.icr.io/$MY_NAMESPACE/guestbook:v2
docker push us.icr.io/$MY_NAMESPACE/guestbook:v2
```

## 2. Edit the deployment file
Open `deployment-v2.yml` and replace:
```yaml
image: us.icr.io/<your-namespace>/guestbook:v2
```
with your actual namespace.

## 3. Apply the rolling update
```bash
kubectl apply -f deployment-v2.yml
```

## 4. Verify the update
```bash
kubectl rollout status deployment/guestbook
kubectl rollout history deployment/guestbook
kubectl get pods
kubectl get rs
```

## 5. Launch the updated app
```bash
kubectl port-forward deployment.apps/guestbook 3000:3000
```
Open the app and capture the updated UI as evidence.

## What to save
- terminal output of `kubectl apply -f deployment-v2.yml`
- screenshot of the updated app
- output of `kubectl rollout history deployment/guestbook`
