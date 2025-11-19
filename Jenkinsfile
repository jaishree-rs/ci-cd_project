pipeline {
    agent any // Run on any available Jenkins agent

    environment {
        // --- These are your custom values ---
        AWS_ACCOUNT_ID      = '651539067267'
        AWS_REGION          = 'us-east-1' // This is correct for N. Virginia
        APP_SERVER_IP       = '98.89.44.51'
        // --- End of your custom values ---
        
        ECR_REPO_NAME       = 'my-ci-cd-app' // This is correct from our setup
        AWS_CREDENTIALS_ID  = 'aws-credentials' // This is correct from our setup
        APP_SERVER_SSH_ID   = 'app-server-ssh-key' // This is correct from our setup
        APP_SERVER_USER     = 'ec2-user'
        
        // These are built automatically from the variables above
        // We make sure the ECR_REGISTRY_URL is all lowercase to fix the build error
        ECR_REGISTRY_URL = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com".toLowerCase()
        IMAGE_TAG        = "${ECR_REPO_NAME}:${BUILD_NUMBER}"
        LATEST_IMAGE_URL = "${ECR_REGISTRY_URL}/${IMAGE_TAG}"
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo 'Checking out code from GitHub...'
                checkout scm
            }
        }

        stage('2. Build Project') {
            steps {
                echo 'Skipping npm install, will be done in Docker build.'
            }
        }
        
        stage('3. Run Tests') {
            steps {
                echo 'Running tests...'
                // This is a placeholder. 'npm test' just echoes an exit 0.
                sh 'npm test' 
            }
        }

        stage('4. Build Docker Image') {
            steps {
                echo "Building Docker image: ${IMAGE_TAG}"
                sh "docker build -t ${IMAGE_TAG} ."
            }
        }

        stage('5. Push to AWS ECR') {
            steps {
                echo "Logging into AWS ECR..."
                // Use the 'aws-credentials' we stored in Jenkins
                withCredentials([aws(credentialsId: AWS_CREDENTIALS_ID, region: AWS_REGION)]) {
                    sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY_URL}"
                }
                
                echo "Tagging image for ECR..."
                sh "docker tag ${IMAGE_TAG} ${LATEST_IMAGE_URL}"

                echo "Pushing image to ECR..."
                sh "docker push ${LATEST_IMAGE_URL}"
            }
        }

        stage('6. Deploy to EC2') {
            steps {
                echo "Deploying to App Server at ${APP_SERVER_IP}..."
                // Use the 'app-server-ssh-key' we stored in Jenkins
                withCredentials([sshUserPrivateKey(credentialsId: APP_SERVER_SSH_ID, keyFileVariable: 'SSH_KEY_FILE')]) {
                    // Use SSH to connect to the app server and run commands
                    sh """
                        ssh -o StrictHostKeyChecking=no -i \${SSH_KEY_FILE} ${APP_SERVER_USER}@${APP_SERVER_IP} '
                            echo "--- Logged into App Server ---"
                            
                            # Log in to ECR on the remote server
                            echo "Logging into ECR on remote server..."
                            aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY_URL}
                            
                            # Stop and remove the old container, if it exists
                            echo "Stopping and removing old container..."
                            docker stop my-app || true
                            docker rm my-app || true
                            
                            # Pull the new image
                            echo "Pulling new image: ${LATEST_IMAGE_URL}"
                            docker pull ${LATEST_IMAGE_URL}
                            
                            # Run the new container
                            echo "Running new container..."
                            docker run -d --name my-app -p 80:8080 ${LATEST_IMAGE_URL}
                            
                            echo "--- Deployment Complete ---"
                        '
                    """
                }
            }
        }
    }
    
    post {
        always {
            echo 'Cleaning up workspace...'
            // We'll just clean up the local tag.
            // 'env.BUILD_NUMBER' is always available.
            sh "docker rmi ${env.ECR_REPO_NAME}:${env.BUILD_NUMBER} || true"
        }
    }
}
