# Assignment Submission Guide

This guide is organized to match the final project flow: deploy the guestbook, apply horizontal scaling, do a rolling update, do a rollback, and save evidence for grading.

## A. Prepare your files
1. Open the project folder.
2. Run:
   ```bash
   npm install
   ```
3. Set version 1 as the active page:
   ```bash
   cp public/index-v1.html public/index.html
   ```
4. Export your namespace:
   ```bash
   export MY_NAMESPACE=sn-labs-$USERNAME
   ```

## B. Build and push version 1
1. Build the image:
   ```bash
   docker build . -t us.icr.io/$MY_NAMESPACE/guestbook:v1
   ```
2. Push the image:
   ```bash
   docker push us.icr.io/$MY_NAMESPACE/guestbook:v1
   ```
3. Save the Dockerfile and the build/push output.

## C. Deploy Redis and the guestbook app
1. Deploy Redis master and replica:
   ```bash
   kubectl apply -f redis-master.yml
   kubectl apply -f redis-replica.yml
   ```
2. Edit `deployment-v1.yml` and replace `<your-namespace>` with your real namespace.
3. Deploy the app:
   ```bash
   kubectl apply -f deployment-v1.yml
   kubectl apply -f service.yml
   ```
4. Start the app locally through port forwarding:
   ```bash
   kubectl port-forward deployment.apps/guestbook 3000:3000
   ```
5. Open the running application using the Skills Network Toolbox or your forwarded local URL.
6. Save a screenshot of the running version 1 app and keep the URL.

## D. Apply Horizontal Pod Autoscaling
1. Create the HPA using the manifest:
   ```bash
   kubectl apply -f hpa.yml
   ```
   Or with the lab command:
   ```bash
   kubectl autoscale deployment guestbook --cpu-percent=50 --min=1 --max=10
   ```
2. Check the HPA:
   ```bash
   kubectl get hpa guestbook
   ```
3. Watch it scale:
   ```bash
   kubectl get hpa guestbook --watch
   ```
4. In a second terminal, generate load using the lab technique or a load generator.
5. Save the HPA output and scaling evidence.

## E. Perform the rolling update
1. Switch the app to version 2:
   ```bash
   cp public/index-v2.html public/index.html
   ```
2. Build and push version 2:
   ```bash
   docker build . -t us.icr.io/$MY_NAMESPACE/guestbook:v2
   docker push us.icr.io/$MY_NAMESPACE/guestbook:v2
   ```
3. Edit `deployment-v2.yml` with your namespace.
4. Apply the update:
   ```bash
   kubectl apply -f deployment-v2.yml
   ```
5. Port-forward again if needed:
   ```bash
   kubectl port-forward deployment.apps/guestbook 3000:3000
   ```
6. Save a screenshot of the updated application.

## F. Perform the rollback
1. View rollout history:
   ```bash
   kubectl rollout history deployment/guestbook
   ```
2. View revision details:
   ```bash
   kubectl rollout history deployment/guestbook --revision=2
   ```
3. Save ReplicaSet state before rollback:
   ```bash
   kubectl get rs
   ```
4. Roll back:
   ```bash
   kubectl rollout undo deployment/guestbook --to-revision=1
   ```
5. Save ReplicaSet state after rollback:
   ```bash
   kubectl get rs
   ```

## G. Save your deliverables
Create a folder called `submission/` and place your text files and screenshots inside it.

Recommended names:
- `01-dockerfile.txt` or `.png`
- `02-image-build-output.txt` or `.png`
- `03-deployment-yaml.txt` or `.png`
- `04-app-running-v1.png`
- `05-hpa-created.txt` or `.png`
- `06-hpa-scaling-watch.txt` or `.png`
- `07-app-running-v2.png`
- `08-rollout-history.txt` or `.png`
- `09-revision-details.txt` or `.png`
- `10-replicasets-before-rollback.txt` or `.png`
- `11-replicasets-after-rollback.txt` or `.png`

## H. How to submit on Skills Network
### Option 1: AI-Graded submission
Upload the required deliverables such as URLs, terminal outputs, code snippets, or screenshots in the AI grading tool for the final project.

### Option 2: Peer-Graded submission
Go to the final project submission area and upload the same evidence through **My Submission** for peer review.

## I. What to upload
At minimum, upload exactly what proves that you:
- built and pushed the app image
- deployed the guestbook app
- ran version 1 successfully
- created and observed HPA
- updated the app to version 2
- viewed rollout history
- rolled back to revision 1

## J. Sample screenshot references
Use the image examples in `../docs/sample-screenshots/` as visual references for what the lab screens normally look like.
