apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: {{APP_SLUG}}
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/KAeHM/personal-cluster
    targetRevision: master
    path: infra/{{APP_SLUG}}
  destination:
    server: https://kubernetes.default.svc
    namespace: {{APP_SLUG}}
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
