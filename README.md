# Online Quiz Web Application

A responsive, browser-based multiple-choice quiz about DevOps fundamentals. The application includes five questions, tracks answer progress, grades submissions on the server, and shows the score and explanations when finished. It is also a hands-on end-to-end DevOps mini project.

## Run locally

Requires Node.js 22 or later. No npm packages are required.

```powershell
npm start
```

Open **http://localhost:3000/** to take the quiz. The API health check is available at **http://localhost:3000/healthz**.

## Run automated tests

In another terminal:

```powershell
npm test
```

The tests cover the web page, health endpoint, answer secrecy, scoring, invalid submissions, malformed JSON, and unknown routes.

## Build and run with Docker

Install and start Docker Desktop, then run from this project folder:

```powershell
docker compose up --build
```

Open **http://localhost:3000/**. Stop the service with `Ctrl+C`, or use `docker compose down` from another terminal.

## GitHub Actions CI/CD

The workflow in `.github/workflows/pipeline.yml` runs on pushes and pull requests targeting `main`:

1. Check out the source and set up Node.js 22.
2. Run `npm test`.
3. Build the Docker image after tests pass.
4. Publish the image to GitHub Container Registry (GHCR) on pushes to `main`, using commit-SHA and `latest` tags.

Pull requests run tests and build the image without publishing it. The publish job uses GitHub's automatically provided `GITHUB_TOKEN`; no long-lived registry credential is required.

## Jenkins CI/CD

The repository also includes a `Jenkinsfile` for running the same project through Jenkins. It checks out the configured branch, runs `npm test`, and builds a Docker image tagged with the Jenkins build number. An optional deployment stage can start that image with Docker Compose on port `3001`; it is disabled by default and can be enabled with the `DEPLOY_LOCAL` build parameter.

### Jenkins prerequisites

- Jenkins with the Pipeline plugin.
- A Jenkins agent with Git, Node.js 22+, Docker CLI, and Docker Compose available on `PATH`.
- The agent's Docker CLI must be able to connect to a running Docker engine. For Docker Desktop on Windows, run the agent under a Windows account that can access Docker Desktop.
- The Jenkins agent must be able to reach GitHub. Configure repository credentials in Jenkins if the GitHub repository is private.

### Configure a Jenkins pipeline job

1. Push this `Jenkinsfile` to the GitHub branch you want Jenkins to build.
2. In Jenkins, choose **New Item**, enter a job name, select **Pipeline**, then choose **OK**.
3. Under **Pipeline**, set **Definition** to **Pipeline script from SCM**.
4. Select **Git**, enter the repository URL, configure credentials if needed, and specify the branch (for example, `*/main`).
5. Set **Script Path** to `Jenkinsfile`, save the job, and select **Build Now**.
6. Review the **Checkout**, **Test**, and **Build Docker image** stages in **Console Output** or the stage view.
7. To deploy from a build, select **Build with Parameters**, enable `DEPLOY_LOCAL`, and run the build. The quiz will be available at `http://localhost:3001/`.

The Jenkins deployment uses the separate Docker Compose project name `online-quiz-jenkins` and port `3001`, leaving the normal local Compose service on port `3000` untouched. Ensure port `3001` is free before enabling deployment. Jenkins builds the image locally; the existing GitHub Actions workflow remains responsible for publishing images to GHCR.

### Practice the pipeline

1. Create a feature branch and make a small change.
2. Run `npm test` locally.
3. Push the branch and open a pull request targeting `main`.
4. Review the **Actions** checks and merge after they pass.
5. Check the next `main` workflow run and GHCR package for the published image.

## Run the published image

After the workflow publishes the package, replace `OWNER/REPOSITORY` with your GitHub owner and repository:

```powershell
docker pull ghcr.io/OWNER/REPOSITORY:latest
docker run --rm -p 3000:3000 ghcr.io/OWNER/REPOSITORY:latest
```

If the package is private, authenticate to GHCR first. Then open **http://localhost:3000/**.

## API

- `GET /` — quiz web application
- `GET /healthz` — readiness and container health check
- `GET /api/quiz` — quiz title, questions, and options (answer key is not exposed)
- `POST /api/quiz/submit` — submit answers as `{"answers":{"q1":"b"}}` and receive a server-calculated score and explanations

Submissions are not persisted. Refreshing or restarting the application does not retain quiz results.

## Pipeline overview

```text
Pull request or push to main
              |
              v
       Run automated tests
              |
              v
         Build image
              |
        +-----+------+
        |            |
   Pull request   Push to main
   build only         |
                     v
                Publish to GHCR
                     |
                     v
             Run container locally
```

Jenkins can independently run checkout, test, image build, and optional local deployment using the root `Jenkinsfile`.
