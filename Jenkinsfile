pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
    }

    parameters {
        booleanParam(
            name: 'DEPLOY_LOCAL',
            defaultValue: false,
            description: 'Deploy this build locally on port 3001 using Docker Compose'
        )
    }

    environment {
        IMAGE_NAME = 'online-quiz-app'
        COMPOSE_PROJECT_NAME = 'online-quiz-jenkins'
        QUIZ_HOST_PORT = '3001'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'npm test'
                    } else {
                        bat 'npm test'
                    }
                }
            }
        }

        stage('Build Docker image') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'docker build -t "$IMAGE_NAME:$BUILD_NUMBER" .'
                    } else {
                        bat 'docker build -t "%IMAGE_NAME%:%BUILD_NUMBER%" .'
                    }
                }
            }
        }

        stage('Deploy locally') {
            when {
                expression { params.DEPLOY_LOCAL }
            }
            steps {
                script {
                    if (isUnix()) {
                        sh 'QUIZ_IMAGE="$IMAGE_NAME:$BUILD_NUMBER" docker compose -p "$COMPOSE_PROJECT_NAME" up --no-build -d'
                    } else {
                        bat 'set "QUIZ_IMAGE=%IMAGE_NAME%:%BUILD_NUMBER%" && docker compose -p "%COMPOSE_PROJECT_NAME%" up --no-build -d'
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Quiz pipeline completed successfully.'
        }
        failure {
            echo 'Quiz pipeline failed. Review the stage logs for details.'
        }
    }
}
