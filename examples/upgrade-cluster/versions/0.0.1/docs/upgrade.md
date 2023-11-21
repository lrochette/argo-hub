# ci tasks

## Summary

This pipeline template is deisgned to help you upgrade your COdefresh GitOps runtime automatically (by attaching it to a cronjob)


## Inputs/Outputs

#### Parameters
* RUNTIME_NAME (required) - The name of the RUNTIME to upgrade
* CF_API_SECRET (required) - The Kubernetes secret containing the Codefresh API key.
* CF_TOKEN_SECRET_KEY (optional) - The key in the Kubernetes secret that has the Codefresh API Key. Default is 'token'
* CF_HOST_URL (optional) - The URL to reach Codefresh (support on-premises Codefresh). Default is 'https://g.codefresh.io'
* GIT_SECRET (required) - The Kubernetes secret containing the GitHub API key
* GIT_TOKEN_SECRET_KEY - (optional) - The key in the Kubernetes secret that has the Git token. Default is 'token'
#### Volumes

No volume

### Outputs
no outputs

## Examples

### task Example
```
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: upgrade-cluster-
spec:
  entrypoint: main

  templates:
  - name: main
    dag:
      tasks:
      - name: upgrade-cluster
        templateRef:
          name: argo-hub.upgrade-cluster.0.0.1
          template: upgrade
        arguments:
          parameters:
          - name: RUNTIME_NAME
            value: 'myruntime'
          - name: CF_API_SECRET
            value: cf-token
          - name: GIT_SECRET
            value: 'github-token'
```
