pipeline {
  agent {
    kubernetes {
      label "cast-stream-receiver-ui-build-agent"
      defaultContainer "jnlp"
      yamlFile "jenkinsAgent.yaml"
    }
  }
  environment {
    NODE_ENV = "production"
  }
  stages {
    stage('Build') {
      steps {
        container("agent") {
          sh "NODE_ENV=development npm install"
          sh "npm run gulp build"
        }
      }
    }
    stage('Publish Docker Image') {
      when {
        expression {
          isMaster()
        }
      }
      steps {
        container("agent") {
          sh "npm run gulp docker.build"
          sh "npm run gulp docker.push"
        }
      }
    }
    stage('Publish Helm Chart') {
      when {
        expression {
          isMaster()
        }
      }
      steps {
        container("agent") {
          withCredentials([emailPassword(credentialsId: "chartmuseum", emailVariable: "USERNAME", passwordVariable: "PASSWORD")]) {
            sh "HELM_REPO_USERNAME=\"${USERNAME}\" HELM_REPO_PASSWORD=\"${PASSWORD}\" npm run gulp helm.push"
          }
        }
      }
    }
    stage('Deploy') {
      when {
        expression {
          isMaster()
        }
      }
      steps {
        container("agent") {
          sh "npm run gulp helm.upgrade"
        }
      }
    }
  }
}

def isRelease() {
  return env.BRANCH_NAME.toLowerCase().startsWith("release")
}
def isMaster() {
  return env.BRANCH_NAME.toLowerCase() == 'master'
}