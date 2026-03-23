# Rollback Guide

## 1. View rollout history
```bash
kubectl rollout history deployment/guestbook
```

## 2. View the details of revision 2
```bash
kubectl rollout history deployment/guestbook --revision=2
```

## 3. Inspect ReplicaSets before rollback
```bash
kubectl get rs
```

## 4. Roll back to revision 1
```bash
kubectl rollout undo deployment/guestbook --to-revision=1
```

## 5. Confirm the rollback
```bash
kubectl get rs
kubectl rollout status deployment/guestbook
```

## What to save
- output of rollout history
- output of revision details
- screenshot or terminal output of `kubectl get rs` before rollback
- screenshot or terminal output of `kubectl get rs` after rollback
