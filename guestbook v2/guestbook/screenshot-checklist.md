# Screenshot Checklist for Peer Grading

Use this list to capture evidence in the same order as the lab.

## Suggested filenames
1. `01-dockerfile.png` or `01-dockerfile.txt`
2. `02-image-build-output.png` or `02-image-build-output.txt`
3. `03-deployment-yaml.png` or `03-deployment-yaml.txt`
4. `04-app-running-v1.png`
5. `05-hpa-created.png` or `05-hpa-created.txt`
6. `06-hpa-scaling-watch.png` or `06-hpa-scaling-watch.txt`
7. `07-app-running-v2.png`
8. `08-rollout-history.png` or `08-rollout-history.txt`
9. `09-revision-details.png` or `09-revision-details.txt`
10. `10-replicasets-before-rollback.png` or `10-replicasets-before-rollback.txt`
11. `11-replicasets-after-rollback.png` or `11-replicasets-after-rollback.txt`

## Exact things to save
- the completed `Dockerfile`
- output showing the image was built and pushed
- the deployment file with the correct image tag
- the running application URL and screenshot of version 1
- the Horizontal Pod Autoscaler output
- the HPA scaling watch output after load generation
- screenshot of the updated application after version 2 is deployed
- rollout history output
- revision details output
- ReplicaSet output before rollback
- ReplicaSet output after rollback

## Sample screenshot references in this bundle
See `../docs/sample-screenshots/`:
- `sample-03.png`
- `sample-06.png`
- `sample-07.png`
- `sample-09.png`
- `sample-11.png`
- `sample-12.png`
- `sample-13.png`
