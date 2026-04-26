pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND  = "adityadeoche/homeshield-backend"
        DOCKER_IMAGE_FRONTEND = "adityadeoche/homeshield-frontend"
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo "Building commit: ${env.GIT_COMMIT}"
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        sh """
                            docker build \
                              -f video_summarizer/backend/Dockerfile \
                              -t ${DOCKER_IMAGE_BACKEND}:${IMAGE_TAG} \
                              -t ${DOCKER_IMAGE_BACKEND}:latest .
                        """
                    }
                }
                stage('Build Frontend') {
                    steps {
                        sh """
                            docker build \
                              -f video_summarizer/frontend/Dockerfile \
                              -t ${DOCKER_IMAGE_FRONTEND}:${IMAGE_TAG} \
                              -t ${DOCKER_IMAGE_FRONTEND}:latest .
                        """
                    }
                }
            }
        }

        stage('Health Check Backend Image') {
            steps {
                sh """
                    # Run without port mapping to avoid conflicts
                    docker run --rm -d --name test-backend ${DOCKER_IMAGE_BACKEND}:${IMAGE_TAG}
                    echo "Waiting 30 seconds for backend to initialize..."
                    sleep 30
                    
                    # Health Check using wget inside the container (bypasses Jenkins networking quirks)
                    if docker exec test-backend wget --spider -q http://localhost:8001/docs; then
                        echo "✅ Backend health check passed!"
                        docker stop test-backend
                    else
                        echo "❌ Backend health check failed! Capturing logs..."
                        docker logs test-backend
                        docker stop test-backend
                        exit 1
                    fi
                """
            }
        }

        stage('Push to Docker Hub') {
            steps {
                retry(3) {
                    withCredentials([usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh '''
                            echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                            docker push $DOCKER_IMAGE_BACKEND:$IMAGE_TAG
                            docker push $DOCKER_IMAGE_BACKEND:latest
                            docker push $DOCKER_IMAGE_FRONTEND:$IMAGE_TAG
                            docker push $DOCKER_IMAGE_FRONTEND:latest
                        '''
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                    sh '''
                        # Automatically patch KUBECONFIG to talk to Mac host from inside Docker
                        sed -i 's/127.0.0.1/host.docker.internal/g' $KUBECONFIG

                        # Create namespace first and wait for it to be ready
                        kubectl apply -f k8s/namespace.yaml --kubeconfig=$KUBECONFIG --insecure-skip-tls-verify=true
                        sleep 5

                        kubectl apply -f k8s/ --kubeconfig=$KUBECONFIG --insecure-skip-tls-verify=true
                        kubectl set image deployment/homeshield-backend backend=$DOCKER_IMAGE_BACKEND:$IMAGE_TAG -n homeshield --kubeconfig=$KUBECONFIG --insecure-skip-tls-verify=true
                        kubectl set image deployment/homeshield-frontend frontend=$DOCKER_IMAGE_FRONTEND:$IMAGE_TAG -n homeshield --kubeconfig=$KUBECONFIG --insecure-skip-tls-verify=true
                        kubectl rollout status deployment/homeshield-backend -n homeshield --kubeconfig=$KUBECONFIG --insecure-skip-tls-verify=true
                        kubectl rollout status deployment/homeshield-frontend -n homeshield --kubeconfig=$KUBECONFIG --insecure-skip-tls-verify=true
                    '''
                }
            }
        }
    }

    post {
        success {
            echo '✅ HomeShield AI deployed successfully to Kubernetes!'
        }
        failure {
            echo '❌ Pipeline failed. Check logs above.'
        }
        always {
            sh 'docker image prune -f'
        }
    }
}
