



10.2 What’s Kubernetes (in 7 minutes)?
Kubernetes (often referred to as k8s for short) describes itself as “an open-source system for automating deployment, scaling, and management of containerized applications” (https://kubernetes.io/). That sounds great, but what does that really mean?

Let’s start simple. Let’s say you have a piece of software that you need to run on your computer. You can start your laptop, log in, and run the program. Congratulations, you just did a manual deployment of your software! So far so good.

Now, imagine that you need the same piece of software to run not on 1, but on 10 computers. All of a sudden, logging into 10 computers doesn’t sound so attractive, so you begin to think about automating that deployment. You could hack together a script that uses SSH to remotely log into the 10 computers and start your program. Or you could use one of the many existing configuration management tools, like Ansible (https://github.com/ansible/ansible) or Chef (https://www.chef.io/). With 10 computers to take care of, it might just work.

Unfortunately, it turns out that the program you started on these machines sometimes crashes. It might not even be a bug, but other problems, for example insufficient disk storage. So you need something to supervise the process, and try to bring it back up when it crashes. You could achieve that by making your configuration management tool configure a systemd service (https://www.freedesktop.org/software/systemd/man/systemd.service.html) so that the process gets restarted automatically every time it dies.

The software also needs to be upgraded. Every time you want to deploy a new version, you need to rerun your configuration management solution to stop and uninstall the previous version, and then install and start the new one. Also, the new version has different dependencies, so you need to take care of that too, during the update. Oh, and now your cluster contains 200 machines, because other people like your program, and then want you to run their software too (no need to reinvent the wheel for each piece of software we want to deploy, right?), so it’s beginning to take a long time to roll a new version out.

Every machine has limited resources (CPU, RAM, disk space), so you now have this massive spreadsheet to keep track of what software should run on which machine, so that they don’t run out of resources. When you onboard a new project, you allocate resources to it, and mark where it should run in the spreadsheet. And when one of the machines goes down, you look for some available room elsewhere, and migrate the software from the affected machine onto another one. It’s hard work, but people keep coming, so you must be doing something right!

Wouldn’t it be great, if there was a program that can do all this for you? Well, yes, you guessed it, it’s called Kubernetes; it does all this and more. Where did it come from?

10.2.1   The very brief history of Kubernetes
Kubernetes, from a Greek word meaning “helmsman” or “governor,” is an open source project released by Google in 2015 as a reimplementation of their internal scheduler system called Borg (https://research.google/pubs/pub43438/). Google donated Kubernetes to a newly formed foundation called Cloud Native Computing Foundation (or CNCF for short https://www.cncf.io/), which created a neutral home for the project and encouraged a massive influx of investment from other companies.

It worked. In the short five years since the project creation, it has become a defacto API for scheduling containers. As companies adopted the open source project, Google managed to pull people away from investing more into AWS-specific solutions, and its cloud offering has gained more clout.

Along the way, the CNCF also gained many auxiliary projects that work with Kubernetes, like the monitoring system Prometheus (https://prometheus.io/), container runtime Containerd (https://containerd.io/) and figuratively tons more.

It all sounds great, but the real question that leads to a wide adoption is: what can it do for you? Let me show you.

10.2.2   What can Kubernetes do for you?
Kubernetes works declaratively, rather than imperatively. What I mean by that is that it lets you describe the software you want to run on your cluster, and it continuously tries to converge the current cluster state into the one you requested. It also lets you read the current state at any given time. Conceptually, it’s an API for herding cats (https://en.wiktionary.org/wiki/herd_cats).

To use Kubernetes, you need a Kubernetes cluster. A Kubernetes cluster is a set of machines that run the Kubernetes components, and that make their resources (CPU, RAM, disk space) available to be allocated and used by your software. These machines are typically called worker nodes. A single Kubernetes cluster can have thousands of worker nodes.

Let’s say that you have a cluster, and you want to run some new software on that cluster. There are three worker nodes in your cluster, each containing a certain amount of resources that are available. Imagine that one of your workers has a moderate amount of resources available, a second one has plenty available, and the third one is entirely used. Depending on the resources the new piece of software needs, your cluster might be able to run it on the first or the second but not the third worker node. Visually, it could look like figure 10.2. Note, that it’s possible (and sometimes pretty useful) to have heterogeneous nodes, with various configurations of resources available.

Figure 10.2 Resources available in a small Kubernetes cluster

What would starting new software on this cluster look like? All you need to do is tell your cluster what your software looks like (the container image to run, any configuration like environment variables of secrets), how much resources you want to give it (CPU, RAM, disk space), and how to run it (how many copies, any constraints on where it should run). You do that by making an HTTP request to the Kubernetes API (or using a tool, like the official CLI called kubectl). The part of the cluster that receives the request, stores it as the desired state, and immediately goes to work in the background on converging the current state of the cluster to the desired state is often referred to as the control plane. Let’s say that you want to deploy version v1.0 of mysoftware. You need to allocate 1 core and 1GB of RAM for each copy, and you need to run two copies for high availability. To make sure that one worker going down doesn’t take both copies down with it, you add a constraint that the two copies shouldn’t run on the same worker node. You send this request to the control plane, which stores it and returns OK. In the background, the same control plane calculates where to schedule the new software, finds two workers with enough available resources and notifies these workers to start your software. See figure 10.3 which shows this process visually.

Figure 10.3 Interacting with a Kubernetes cluster

And voila! That’s what Kubernetes can do for you. Instead of making your machines do specific, low-level tasks like starting a process, you can tell your cluster to figure out how to do what you need it to do. This is a 10,000-feet aerial view, but don’t worry, we’ll get into the nitty gritty later in the chapter. Right now, I bet you can’t wait for some hands-on experience. Let’s get to that by setting up a test cluster.

NOTE POP QUIZ: WHAT’S KUBERNETES?
Pick one:

1. A solution to all of your problems

2. A software that automatically renders the system running on it immune to failure

3. A container orchestrator that can managed thousands of VMs and will continuously try to converge the current state into the desired state

4. A thing for sailors

See appendix B for answers.

10.3 Setting up a Kubernetes cluster
Before we can continue with our scenario, you’re going to need access to a working Kubernetes cluster. The beauty of Kubernetes, is that you can get the cluster from various providers, and it should behave exactly the same! All the examples in this chapter will work on any conformant clusters and I will mention where there might be potential caveats. Therefore you’re free to pick whatever installation of Kubernetes is the most convenient for you.

For those who don’t have a Kubernetes cluster handy, the easiest way to get started is to deploy a single-node, local mini-cluster on your local machine with Minikube (https://github.com/kubernetes/minikube). Minikube is an official part of Kubernetes itself, and allows you to deploy a single node with single instances of all the Kubernetes control plane components inside of a virtual machine. It also takes care of the little-yet-crucial things like helping you easily access things running inside of the cluster.

Before continuing, please follow Appendix A to install Minikube. In this chapter, I’ll assume you’re following along with a Minikube installation on your laptop. I’ll also mention whatever might be different if you’re not. Everything in this chapter was tested on Minikube 1.12.3, and Kubernetes 1.18.3.

10.3.1   Starting a cluster
Depending on the platform, Minikube supports multiple virtualization options to run the actual VM with Kubernetes. The options differ for each platform and include:

Linux: KVM or VirtualBox (running processes directly on the host is also supported)
macOS: HyperKit, VMware Fusion, Parallels or VirtualBox
Windows: Hyper-V or VirtualBox
For our purposes, you can pick any of the supported options and it should work all the same. But because I already made you install VirtualBox for the previous chapters and it’s a common denominator of all three supported platforms, I’d recommend we stick with VirtualBox.

To start a cluster, all you need is the minikube start command. To specify the VirtualBox driver, use the --driver flag. Run the following command from a terminal to start a new cluster using VirtualBox:

minikube start --driver=virtualbox

The command might take a minute, because minikube needs to download the VM image for your cluster and then start a VM with that image. When it’s done, you will see the output similar to the following. Someone took the time to pick relevant emoticons for each log message, so I took the time to respect that and copy verbatim. You can see that it used the VirtualBox driver like I requested and defaulted to give the VM 2 CPUs, 4GB of RAM and 2GB of storage. It’s also running Kubernetes v1.18.3 on Docker 19.03.12 (all in bold font).

😄  minikube v1.12.3 on Darwin 10.14.6 
  ✨  Using the virtualbox driver based on user configuration 
  👍  Starting control plane node minikube in cluster minikube 
  🔥  Creating virtualbox VM (CPUs=2, Memory=4000MB, Disk=20000MB) … 
  🐳  Preparing Kubernetes v1.18.3 on Docker 19.03.12 … 
  🔎  Verifying Kubernetes components… 
  🌟  Enabled addons: default-storageclass, storage-provisioner 
  🏄  Done! kubectl is now configured to use "minikube"

To confirm that it started OK, try to list all pods running on the cluster. Run the following command in a terminal:

kubectl get pods -A

You will see the output just like the following, listing the different components that together make the Kubernetes control plane. We will cover in detail how they work later in this chapter. For now, this command working at all proves that the control plane works.

NAMESPACE     NAME                  READY   STATUS    RESTARTS   AGE 
  kube-system   coredns-66bff467f8-62g9p           1/1     Running   0          5m44s 
  kube-system   etcd-minikube         1/1     Running   0          5m49s 
  kube-system   kube-apiserver-minikube            1/1     Running   0          5m49s 
  kube-system   kube-controller-manager-minikube   1/1     Running   0          5m49s 
  kube-system   kube-proxy-bwzcf      1/1     Running   0          5m44s 
  kube-system   kube-scheduler-minikube            1/1     Running   0          5m49s 
  kube-system   storage-provisioner                1/1     Running   0          5m49s

  We’re now ready to go. When you’re done for the day and want to stop the cluster, use minikube stop, and to resume the cluster use minikube start.

NOTE GETTING KUBECTL HELP
You can use the command kubectl --help to get help on all available commands in kubectl. If you’d like more details on a particular command, use --help on that command. For example, to get help about the available options of the get command, just run kubectl get --help.

Time to get our hands dirty with the High Profile Project.

10.4 Testing out software running on Kubernetes
With a functional Kubernetes cluster at our disposal, we’re now ready to start working on the High Profile Project, aka ICANT. The pressure is on, we have a project to save!

As always, the first step is to build an understanding of how things work before we can reason about how they break. We’ll do that by kicking the tires and looking how ICANT is deployed and configured. Once we’re done with that, we’ll conduct two experiments and then finish this section by seeing how to make things easier for ourselves for the next time. Let’s start at the beginning - by running the actual project

10.4.1   Running the ICANT Project
As we discovered earlier when reading the documentation you inherited, the project didn’t get very far. They took an off-the-shelf component (Goldpinger), deployed it, and called it a day. All of which is bad news for the project, but good news to me; I have less explaining to do!

Goldpinger works by querying Kubernetes for all the instances of itself, and then periodically calling each of these instances and measuring the response time. It then uses that data to generate statistics (metrics) and plot a pretty connectivity graph. Each instance works in the same way - it periodically gets the address of its peers, and makes a request to each one of them. This is illustrated in figure 10.4. Goldpinger was invented to detect network slow-downs and problems, especially in larger clusters. It’s really simple and very effective.

Figure 10.4 Overview of how Goldpinger works

How do we go about running it? We’ll do it in two steps:

Set up the right permissions, so that Goldpinger can query Kubernetes for its peer
Deploy it on the cluster
We’re about to step into Kubernetes Wonderland, so let me introduce you to some Kubernetes lingo.

Kubernetes terminology
The documentation often mentions resources to mean the objects representing various abstractions that Kubernetes offers. For now, I’m going to introduce you to three basic building blocks used to describe software on Kubernetes:

Pod. A pod is a collection of containers that are grouped together, run on the same host and share some system resources, for example an IP address. This is the unit of software that you can schedule on Kubernetes. You can schedule pods directly, but most of the time you will be using a higher level abstraction, such as a Deployment.
Deployment. A deployment describes a blueprint for creating pods, along with extra metadata, like for example the number of replicas to run. Importantly, it also manages the lifecycle of pods that it creates. For example, if you modify a deployment to update a version of the image you want to run, the deployment can handle a rollout, deleting old pods and creating new ones one by one to avoid an outage. It also offers other things, like roll-back, if the roll out ever fails.
Service. A service matches an arbitrary set of pods, and provides a single IP address that resolves to the matched pods. That IP is kept up to date with the changes made to the cluster. For example, if a pod goes down, it will be taken out of the pool.

You can see a visual representation of how these fit together in figure 10.5.

Figure 10.5 Pods, deployments and services example in Kubernetes

Another thing you need to know to understand how Goldpinger works is that to query Kubernetes, you need to have the right permissions.

NOTE POP QUIZ: WHAT’S A KUBERNETES DEPLOYMENT?
Pick one:

1. A description of how to reach software running on your cluster

2. A description of how to deploy some software on your cluster

3. A description of how to build a container

See appendix B for answers.

Permissions
Kubernetes has an elegant way of managing permissions. First, it has a concept of a ClusterRole, that allows you to define a role and a corresponding set of permissions to execute verbs (create, get, delete, list, …) on various resources. Second, it has the concept of ServiceAccounts, which can be linked to any software running on Kubernetes, so that it inherits all the permissions that the ServiceAccount was granted. And finally, to make a link between a ServiceAccount and a ClusterRole, you can use a ClusterRoleBinding, which does exactly what it says on the tin.

If you’re new to it, this permissioning might sound a little bit abstract, so take a look at figure 10.6 for a graphical representation of how all of this comes together.

Figure 10.6 Kubernetes permissioning example

In our case, we want to allow Goldpinger pods to list its peers, so all we need is a single ClusterRole, and the corresponding ServiceAccount and ClusterRoleBinding. Later, we will use that ServiceAccount to permission the Goldpinger pods.

Creating the resources
Time for some code! In Kubernetes, we can describe all resources we want to create using a Yaml file (.yml; https://yaml.org/) that follows the specific format that Kubernetes accepts. See listing 10.1 to see how all of this permissioning translates into .yml. For each element we described, there is a Yaml object, specifying the corresponding type (kind) and the expected parameters. First, a ClusterRole called goldpinger-clusterrole that allows for listing pods (bold font). Then a ServiceAccount called goldpinger-serviceaccount (bold font). And finally, a ClusterRoleBinding, linking the ClusterRole to the ServiceAccount. If you’re new to Yaml, note that the --- separators allow for describing multiple resources in a single file.

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: goldpinger-clusterrole
rules:
- apiGroups:
  - ""
  resources:
  - pods
  verbs:
  - list
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: goldpinger-serviceaccount
  namespace: default
---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRoleBinding
metadata:
  name: goldpinger-clusterrolebinding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: goldpinger-clusterrole
subjects:
  - kind: ServiceAccount
    name: goldpinger-serviceaccount
    namespace: default

#A we start with a cluster role

#B the cluster role gets permissions for resource of type pod

#C the cluster role gets permissions to list the resource of type pod

#D we create a service account to use later

#E we create a cluster role binding, that binds the cluster role...

#F … to the service account

This takes care of the permissionsing part. Let’s now go ahead and see what deploying the actual Goldpinger looks like.

Goldpinger .yml files
To make sense of deploying Goldpinger, I need to explain one more detail that I skipped over so far: matching and labels.

Kubernetes makes extensive use of labels, which are simple key-value pairs of type string. Every resource can have arbitrary metadata attached to it, including labels. They are used by Kubernetes to match sets of resources, and are fairly flexible and easy to use.

For example, let’s say that you have two pods, with the following labels:

Pod A, with labels app=goldpinger and stage=dev
Pod B, with labels app=goldpinger and stage=prod
If you match (select) all pods with label app=goldpinger, you will get both pods. But if you match with label stage=dev, you will only get pod A. You can also query by multiple labels, and in that case Kubernetes will return pods matching all requested labels (a logical AND).

Labels are useful for manually grouping resources, but they’re also leveraged by Kubernetes, for example to implement deployments. When you create a deployment, you need to specify the selector (a set of labels to match), and that selector needs to match the pods created by the deployment. The connection between the deployment and the pods it manages relies on labels.

Label-matching is also the same mechanism that Goldpinger leverages to query for its peers: it just asks Kubernetes for all pods with a specific label (by default app=goldpinger). Figure 10.7 shows that graphically.

Figure 10.7 Kubernetes permissioning example

Putting this all together, we can finally write a .yml file with two resource descriptors: a deployment and a matching service.

Inside the deployment, we need to specify the following:

The number of replicas (we’ll go with three for demonstration purposes)
The selector (again the default app=goldpinger),
The actual template of pods to create
In the pod template, we will specify the container image to run, some environment values required for Goldpinger to work and ports to expose so that other instances can reach it. The important bit is that we need to specify some arbitrary port that matches the PORT environment variable (this is what Goldpinger uses to know what port to listen on). We’ll go with 8080. Finally, we also specify the service account we created earlier on, to permission the Goldpinger pods to query Kubernetes for their peers.

Inside the service, we once again use the same selector (app=goldpinger), so that the service matches the pods created by the deployment, and the same port 8080 that we specified on the deployment.

NOTE DEPLOYMENTS AND DAEMONSETS
In a typical installation, we would like to have one Goldpinger pod per node (physical machine, VM) in your cluster. That can be easily achieved by using a DaemonSet (it works a lot like a deployment, but instead of specifying the number of replicas, it just assumes one replica per node - learn more at https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/). In our example setup we will use a Deployment instead, because with only one node, we would only have a single pod of Goldpinger, which defeats the purpose of this demonstration.

Listing 10.2 contains the .yml file we can use to create the deployment and the service. Take a look.

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: goldpinger
  namespace: default
  labels:
    app: goldpinger
spec:
  replicas: 3
  selector:
    matchLabels:
      app: goldpinger
  template:
    metadata:
      labels:
        app: goldpinger
    spec:
      serviceAccount: "goldpinger-serviceaccount"
      containers:
      - name: goldpinger
        image: "docker.io/bloomberg/goldpinger:v3.0.0"
        env:
        - name: REFRESH_INTERVAL
          value: "2"
        - name: HOST
          value: "0.0.0.0"
        - name: PORT
          value: "8080"
        # injecting real pod IP will make things easier to understand
        - name: POD_IP
          valueFrom:
            fieldRef:
              fieldPath: status.podIP
        ports:
        - containerPort: 8080
          name: http
---
apiVersion: v1
kind: Service
metadata:
  name: goldpinger
  namespace: default
  labels:
    app: goldpinger
spec:
  type: LoadBalancer
  ports:
    - port: 8080
      name: http
  selector:
    app: goldpinger

#A the deployment will create three replicas of the pods (three pods)

#B the deployment is configured to match pods with label app=goldpinger

#C the pods template actually gets the label app=goldpinger

#D we configure the Goldpinger pods to run on port 8080

#E we expose the port 8080 on the pod, so that it’s reachable

#F in the service, we target port 8080 that we made available on the pods

#G the service will target pods based on the label app=goldpinger

With that, we’re now ready to actually start it! If you’re following along, you can find the source code for both of these files (goldpinger-rbac.yml and goldpinger.yml) at https://github.com/seeker89/chaos-engineering-book/tree/master/examples/kubernetes. Let’s make sure that both files are in the same folder, and let’s go ahead and run them.

Deploying Goldpinger

Start by creating the permissioning resources (the goldpinger-rbac.yml file), by running the following command: 
   kubectl apply -f goldpinger-rbac.yml

You will see Kubernetes confirming the three resources were created successfully, with the following output:

clusterrole.rbac.authorization.k8s.io/goldpinger-clusterrole created 
  serviceaccount/goldpinger-serviceaccount created 
  clusterrolebinding.rbac.authorization.k8s.io/goldpinger-clusterrolebinding created

Then, create the actual deployment and a service by running the following command:

kubectl apply -f goldpinger.yml

Just like before, you will see the confirmation that the resources were created:

deployment.apps/goldpinger created
service/goldpinger created

Once that’s done, let’s confirm that pods are running as expected. To do that, list the pods by running the following command:

kubectl get pods

You should see an output similar to the following, with three pods in status Running (bold font). If they’re not, you might need to give it a few seconds to start:

NAME            READY   STATUS    RESTARTS   AGE
goldpinger-c86c78448-5kwpp   1/1     Running   0          1m4s
goldpinger-c86c78448-gtbvv   1/1     Running   0          1m4s
goldpinger-c86c78448-vcwx2   1/1     Running   0          1m4s

The pods are running, meaning that the deployment did its job. Goldpinger crashes if it can’t list its peers, which means that the permissioning we set up also works as expected. The last thing to check, is that the service was configured correctly. You can do that by running the following command, specifying the name of the service we created (“goldpinger”):

1
kubectl describe svc goldpinger

You will see the details of the service, just like in the following output (abbreviated). Note the Endpoints field, specifying three IP addresses, for the three pods that it’s configured to match.

Name:        goldpinger
Namespace:                default
Labels:      app=goldpinger
(...)
Endpoints:                172.17.0.3:8080,172.17.0.4:8080,172.17.0.5:8080
(...)

If you want to be 100% sure that the IPs are correct, you can compare them to the IPs of Goldpinger pods. You can display them easily, by appending -o wide (for wide output) to the kubectl get pods command. Try it by running the following:

kubectl get pods -o wide

You will see the same list as before, but this time with extra details, including the IP (bold font). They should correspond to the list specified in the service. If they weren’t, it would point to misconfigured labels. Note, that depending on your internet connection speed and your setup, it might take a little bit of time to start. If you see pods in pending state, give it an extra minute:

NAME            READY   STATUS    RESTARTS   AGE   IP           NODE       NOMINATED NODE   READINESS GATES
goldpinger-c86c78448-5kwpp   1/1     Running   0          15m   172.17.0.4   minikube   <none>           <none>
goldpinger-c86c78448-gtbvv   1/1     Running   0          15m   172.17.0.3   minikube   <none>           <none>
goldpinger-c86c78448-vcwx2   1/1     Running   0          15m   172.17.0.5   minikube   <none>           <none>

Everything's up and running, so let’s access Goldpinger to see what it’s really doing. To do that, we’ll need to access the service we created.

NOTE ACCESSING THE SOFTWARE RUNNING ON KUBERNETES FROM OUTSIDE THE CLUSTER
Kubernetes does a great job standardizing the way people run their software. Unfortunately, not everything is easily standardized. Although every Kubernetes cluster supports services, the way you access the cluster and therefore its services depends on the way the cluster was set up. In this chapter, we will stick to Minikube, because it’s simple and easily accessible to anyone. If you’re running your own Kubernetes cluster, or use a managed solution from one of the cloud providers, accessing software running on the cluster might involve some extra setup (for example setting up an Ingress https://kubernetes.io/docs/concepts/services-networking/ingress/). Refer to the relevant documentation.

On Minikube, we can leverage the command minikube service, which will figure out a way to access the service directly from your host machine and open the browser for you. To do that, run the following command:

minikube service goldpinger

You will see an output similar to the following, specifying the special URL that Minikube prepared for you (bold font). Your default browser will be launched to open that URL.

|-----------|------------|-------------|-----------------------------|
| NAMESPACE |    NAME    | TARGET PORT |             URL             |
|-----------|------------|-------------|-----------------------------|
| default   | goldpinger | http/8080   | http://192.168.99.100:30426 |
|-----------|------------|-------------|-----------------------------|
🎉  Opening service default/goldpinger in default browser…

Inside the newly launched browser window, you will see the Goldpinger UI. It will look similar to what’s shown in figure 10.8. It’s a graph, on which every point represents an instance of Goldpinger, and every arrow represents the last connectivity check (an HTTP request) between the instances. You can click a node to select it and display extra information. It also provides other functionality like a heatmap, showing hotspots of any potential networking slowness; and metrics, providing statistics that can be used to generate alerts and pretty dashboards. Goldpinger is a really handy tool for detecting any network issues, downloaded more than a million times from Docker Hub!

Figure 10.8 Goldpinger UI in action

Feel free to take some time to play around, but otherwise we’re done setting it all up. We have a running application that we can interact with, all deployed with just two kubectl commands.

Unfortunately, on our little test cluster, all three instances are running on the same host, so we’re unlikely to see any network slowness, which is pretty boring. Fortunately, as chaos engineering practitioners, we’re well equipped to introduce failure and make things interesting again. Let’s start with the basics - an experiment to kill some pods.

10.4.2   Experiment 1: kill 50% of pods
Much like a villain from a comic book movie, we might be interested in seeing what happens when we kill 50% of Goldpinger pods. Why do that? It’s an inexpensive experiment that can answer a lot of questions about what happens when one of these instances goes down (simulating a machine going down). For example:

Do the other instances detect that to begin with?
If so, how long before they detect it?
How does Goldpinger configuration affect all of that?
If we had an alert set up, would it get triggered?
How should we go about implementing this? In the previous chapters, we’ve covered different ways this could be addressed. For example, you could log into the machine running the Goldpinger process you want to kill, and simply run a kill command, like we did before. Or, if your cluster uses Docker to run the containers (more on that soon), you could leverage the tools we’ve covered in chapter 5. The point is that all of the techniques you learned in the previous chapter still apply. That said, Kubernetes gives us other options, like directly deleting pods. It’s definitely the most convenient way of achieving that, so let’s go with that option.

There is another crucial detail to our experiment: Goldpinger works by periodically making HTTP requests to all of its peers. That period is controlled by the environment variable called REFRESH_PERIOD. In the goldpinger.yml file you deployed, that value was set to 2 seconds:

name: REFRESH_INTERVAL 
  value: "2"

  That means that the maximum time it takes for an instance to notice another instance being down is 2 seconds. This is pretty aggressive and in a large cluster would result in a lot of traffic and CPU time spent on this, but I chose that value for our demonstration purposes. It will be handy to see the changes detected quickly. With that, we now have all the elements, so let’s turn this into a concrete plan of an experiment.

Experiment 1: plan
If we take the first question we mentioned (do other Goldpinger instances detect a peer down), we can design a simple experiment plan like so:

Observability: use Goldpinger UI to see if there are any pods marked as inaccessible; use kubectl to see new pods come and go
Steady state: all nodes healthy
Hypothesis: if we delete one pod, we should see it in marked as failed in Goldpinger UI, and then be replaced by a new, healthy pod
Run the experiment

That’s it! Let’s see how to implement it.

Experiment 1: implementation
To implement this experiment, the pod labels come in useful once again. All we need to do is leverage kubectl get pods to get all pods with label app=goldpinger, pick a random pod and kill it, using kubectl delete. To make things easy, we can also leverage kubectl’s -o name flag to only display the pod names, and use a combination of sort --random-sort and head -n1 to pick a random line of the output. Put all of this together, and you get a script like kube-thanos.sh from listing 10.3. Store it somewhere on your system (or clone it from the Github repo).

#!/bin/bash
 
kubectl get pods \
  -l app=goldpinger \
  -o name \
    | sort --random-sort \
    | head -n 1 \
    | xargs kubectl delete

#A use kubectl to list pods

#B only list pods with label app=goldpinger

#C only display the name as the output

#D sort in random order

#E pick the first one

#E delete the pod

Armed with that, we’re ready to rock. Let’s run the experiment.

Experiment 1: run!

Let’s start by double-checking the steady state. Your Goldpinger installation should still be running and you should have the UI open in a browser window. If it’s not, you can bring both back up by running the following commands:

kubectl apply -f goldpinger-rbac.yml 
  kubectl apply -f goldpinger.yml 
  minikube service goldpinger

To confirm all nodes are OK, simply refresh the graph by clicking the “reload” button, and verify that all three nodes are showing in green. So far so good.

To confirm that our script works, let’s also set up some observability for the pods being deleted and created. We can leverage the --watch flag of the kubectl get command to print the names of all pods coming and going to the console. You can do that by opening a new terminal window, and running the following command:

kubectl get pods --watch

You will see the familiar output, showing all the Goldpinger pods, but this time the command will stay active, blocking the terminal. You can use Ctrl-C to exit at any time, if needed.

NAME            READY   STATUS    RESTARTS   AGE 
  goldpinger-c86c78448-6rtw4   1/1     Running   0          20h 
  goldpinger-c86c78448-mj76q   1/1     Running   0          19h 
  goldpinger-c86c78448-xbj7s   1/1     Running   0          19h

Now, to the fun part! To conduct our experiment, we’ll open another terminal window for the kube-thanos.sh script, run it to kill a random pod, and then quickly go to the Goldpinger UI to observe what the Goldpinger pods saw. Bear in mind that in the local setup, the pods will recover very rapidly, so you might need to be quick to actually observe the pod becoming unavailable and then healing. In the meantime, the kubectl get pods --watch command will record the pod going down and a replacement coming up. Let’s do that!

Open a new terminal window and run the script to kill a random pod:

bash kube-thanos.sh

You will see an output showing the name of the pod being deleted, like in the following:

pod "goldpinger-c86c78448-shtdq" deleted

Go quickly to the Goldpinger UI and click refresh. You should see some failure, like in figure 10.9. Nodes that can’t be reached by at least one other node will be marked as unhealthy. I marked the unhealthy node in the figure. The live UI also uses a red color to differentiate them. You will also notice that there are four nodes showing up. This is because after the pod is deleted, Kubernetes tries to recoverge to the desired state (three replicas), so it creates a new pod to replace the one we deleted.

NOTE BE QUICK!
If you’re not seeing any errors, the pods probably recovered before you switched to the UI window, because your computer is quicker than mine when I was writing this and chose the parameters. If you re-run the command and refresh the UI more quickly, you should be able to see it.

Figure 10.9 Goldpinger UI showing an unavailable pod being replaced by a new one

Now, go back to the terminal window that is running kubectl get pods --watch. You will see an output similar to the following. Note the pod that we killed (-shtdq) going into Terminating state, and a new pod (-lwxrq) taking its place (both in bold font). You will also notice that the new pod goes through a lifecycle of Pending to ContainerCreating to Running, while the old one goes to Terminating.

NAME            READY   STATUS    RESTARTS   AGE 
  goldpinger-c86c78448-pfqmc   1/1     Running   0          47s 
  goldpinger-c86c78448-shtdq   1/1     Running   0          22s 
  goldpinger-c86c78448-xbj7s   1/1     Running   0          20h 
  goldpinger-c86c78448-shtdq   1/1     Terminating   0          38s 
  goldpinger-c86c78448-lwxrq   0/1     Pending       0          0s 
  goldpinger-c86c78448-lwxrq   0/1     Pending       0          0s 
  goldpinger-c86c78448-lwxrq   0/1     ContainerCreating   0          0s 
  goldpinger-c86c78448-shtdq   0/1     Terminating         0          39s 
  goldpinger-c86c78448-lwxrq   1/1     Running             0          2s 
  goldpinger-c86c78448-shtdq   0/1     Terminating         0          43s 
  goldpinger-c86c78448-shtdq   0/1     Terminating         0          43s

  Finally, let’s check that everything recovered smoothly. To do that, go back to the browser window with Goldpinger UI, and refresh once more. You should now see the three new pods happily pinging each other, all in green. Which means that our hypothesis was correct, on both fronts.

Nice job. Another one bites the dust, another experiment under your belt. But before we move on, let’s just discuss a few points.

NOTE POP QUIZ: WHAT HAPPENS WHEN A POD DIES ON A KUBERNETES CLUSTER?
Pick one:

1. Kubernetes detects it and send you an alert

2. Kubernetes detects it, and will restart it as necessary to make sure the expected number of replicas are running

3. Nothing

See appendix B for answers.

Experiment 1: discussion

For the sake of teaching, I took a few shortcuts here that I want to make you aware of. First, when accessing the pods through the UI, we’re using a service, which resolves to a pseudo-random instance of Goldpinger every time you make a new call. That means that it’s possible to get routed to the instance we just killed, and get an error in the UI. It also means that every time you refresh the view, you get the reality from a point of view of a different pod. For illustration purposes, that’s not a deal-breaker on a small test cluster but if you run a large cluster and want to make sure that a network partition doesn’t obscure your view, you will need to make sure you consult all available instances, or at least a reasonable subset. Goldpinger addresses that issue with metrics, and you can learn more about that at https://github.com/bloomberg/goldpinger#prometheus

Second, using a GUI-based tool this way is a little bit awkward. If you see what you expect, that’s great. But if you don’t, it doesn’t necessarily mean it didn’t happen, it might be that you simply missed it. Again, this can be alleviated by using the metrics, which I skipped here for the sake of simplicity.

Third, if you look closely at the failures that you see in the graph, you will see that the pods sometimes start receiving traffic before they are actually up. This is because, again for simplicity, I skipped the readiness probe that serves exactly that purpose. If set, a readiness probe prevents a pod from receiving any traffic until a certain condition is met (see the documentation at https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/). For an example of how to use it, see the installation docs of Goldpinger (https://github.com/bloomberg/goldpinger#installation).

Finally, remember that depending on the refresh period you’re running Goldpinger with, the data you’re looking at is up to that many seconds stale, which means that for the pods we killed, we’ll keep seeing them for an extra number of seconds equal to the refresh period (2 seconds in our setup).

These are the caveats my lawyers advised me to clarify before this goes to print. In case that makes you think I’m not fun at parties, let me prove you wrong. Let’s play some Invaders, like it’s 1978.

10.4.3   Party trick: killing pods in style
If you really want to make a point that chaos engineering is fun, I’ve got two tools for you.

First, KubeInvaders (https://github.com/lucky-sideburn/KubeInvaders). It gamifies the process of killing pods by starting a clone of Space Invaders, where the aliens are pods in the specified namespace. You guessed it, the ones you shoot down are deleted in Kubernetes. Installation involves deploying it on a cluster, and then connecting a local client that actually displays the game content. See figure 10.10 to see what it looks like in action.

Figure 10.10 Kubeinvader screenshot from https://github.com/lucky-sideburn/KubeInvaders

The second one is for fans of the first-person shooter genre: Kube DOOM (https://github.com/storax/kubedoom). Similar to KubeInvaders, it represents pods as enemies, and kills in Kubernetes the ones that die in the game. Tip to justify using it: it’s often much quicker than copying and pasting a name of a pod, saving so much time (mandatory reference: https://xkcd.com/303/). See figure 10.11 for a screenshot.

Figure 10.11 Kube DOOM screenshot from https://github.com/storax/kubedoom

For Kube DOOM, the installation is pretty straightforward: you run a pod on the host, pass a kubectl configuration file to it, and then use a desktop sharing client to connect to the game. After a long day of debugging, it might be just what you need. I’ll just leave it there.

I’m sure that will help with your next house party. When you finish the game, let’s take a look at another experiment - some good old network slowness.

10.4.4   Experiment 2: network slowness
Slowness, my nemesis, we meet again. If you’re a software engineer, chances are you’re spending a lot of your time trying to outwit slowness. When things go wrong, actual failure is often easier to debug than situations when things mostly work. And slowness tends to fall into the latter category.

Slowness is such an important topic that we touch upon it in nearly every chapter of this book. We introduced some slowness using tc in chapter 4, and then again using Pumba in Docker in chapter 5. We use some in the context of JVM, application level ,and even browser in other chapters. Time to take a look at what’s different when running on Kubernetes.

It’s worth mentioning that everything we covered before still applies here. We could very well use tc or Pumba directly on one of the machines running the processes we’re interested in, and modify them to introduce the failure we care about. In fact, using kubectl cp and kubectl exec, we could upload and execute tc commands directly in a pod, without even worrying about accessing the host. Or we could even add a second container to the Goldpinger pod that would execute the necessary tc commands.

All of these options are viable, but share one downside: they modify the existing software that’s running on your cluster, and so by definition carry risks of messing things up. A convenient alternative is to add extra software, tweaked to implement the failure we care about, but otherwise identical to the original and introduce the extra software in a way that will integrate with the rest of the system. Kubernetes makes it really easy. Let me show you what I mean; let’s design an experiment around simulated network slowness.

Experiment 2: plan

Let’s say that we want to see what happens when one instance of Goldpinger is slow to respond to queries of its peers. After all, this is what this piece of software was designed to help with, so before we rely on it, we should test that it works as expected.

A convenient way of doing that is to deploy a copy of Goldpinger that we can modify to add a delay. Once again, we could do it with tc, but to show you some new tools, let’s use a standalone network proxy instead. That proxy will sit in front of that new Goldpinger instance, receive the calls from its peers, add the delay, and relay the calls to Goldpinger. Thanks to Kubernetes, setting it all up is pretty straightforward.

Let’s iron out some details. Goldpinger’s default timeout for all calls is 300ms, so let’s pick an arbitrary value of 250ms for our delay: enough to be clearly seen, but not enough to cause a timeout. And thanks to the built-in heatmap, we will be able to visually show the connections that take longer than others, so the observability aspect is taken care of. The plan of the experiment figuratively writes itself:

