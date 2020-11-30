Observability: use Goldpinger UI to read delays using the graph UI and the heatmap
Steady state: all existing Goldpinger instantes report healthy
Hypothesis: if we add a new instance that has a 250ms delay, the connectivity graph will show all four instances healthy, and the 250ms delay will be visible in the heatmap
Run the experiment!
Sounds good? Let’s see how to implement it.

Experiment 2: implementation
Time to dig into what the implementation will look like. Do you remember figure 10.4 that showed how Goldpinger worked? Let me copy it for your convenience in figure 10.12. Every instance asks Kubernetes for all its peers, and then periodically makes calls to them to measure latency and detect problems.

Figure 10.12 Overview of how Goldpinger works (again)

Now, what we want to do is add a copy of the Goldpinger pod that has the extra proxy we just discussed in front of it. A pod in Kubernetes can have multiple containers running alongside each other and able to communicate via localhost. If we use the same label app=goldpinger, the other instances will detect the new pod and start calling. But we will configure the ports in a way that instead of directly reaching the new instance, the peers will first reach the proxy (in port 8080). And the proxy will add the desired latency. The extra Goldpinger instance will be able to ping the other hosts freely, like a regular instance. This is summarized in figure 10.13.

Figure 10.13 A modified copy of Goldpinger with an extra proxy in front of it

We’ve got the idea of what the setup will look like, now we need the actual networking proxy. Goldpinger communicates via HTTP/1.1, so we’re in luck. It’s a text-based, reasonably simple protocol running on top of TCP. All we need is the protocol specification (RFC 7230[1], RFC 7231[2], RFC 7232[3], RFC 7233[4] and RFC 7234[5]) and we should be able to implement a quick proxy in no time. Dust off your C compiler, stretch your arms, and let’s do it!

Experiment 2: Toxiproxy
Just kidding! We’ll use an existing, open-source project designed for this kind of thing, called Toxiproxy (https://github.com/shopify/toxiproxy). It works as a proxy on TCP level (L4 OSI model), which is fine for us, because we don’t actually need to understand anything about what’s going on on the HTTP level (L7) to introduce a simple latency. The added benefit is that you can use the same tool for any other TCP-based protocol in the exact same way, so what we’re about to do will be equally applicable to a lot of other popular software, like Redis, MySQL, PostgreSQL and many more.

ToxiProxy consists of two pieces:

the actual proxy server, which exposes an API you can use to configure what should be proxied where and the kind of failure that you expect
and a CLI client, that connects to that API and can change the configuration live
NOTE CLI AND API
Instead of using the CLI, you can also talk to the API directly, and ToxiProxy offers ready-to-use clients in a variety of languages.

The dynamic nature of ToxiProxy makes it really useful when used in unit and integration testing. For example, your integration test could start by configuring the proxy to add latency when connecting to a database, and then your test could verify that timeouts are triggered accordingly. It’s also going to be handy for us in implementing our experiment.

The version we’ll use, 2.1.4 (https://github.com/Shopify/toxiproxy/releases/tag/v2.1.4), is the latest available release at the time of writing. We’re going to run the proxy server as part of the extra Goldpinger pod using a prebuilt, publicly available image from Docker Hub. We’ll also need to use the CLI locally on your machine. To install it, download the CLI executable for your system (Ubuntu/Debian, Windows, MacOS) from https://github.com/Shopify/toxiproxy/releases/tag/v2.1.4 and add it to your PATH. To confirm it works, run the following command:

toxiproxy-cli –version

You should see the version 2.1.4 displayed, like in the following output:

toxiproxy-cli version 2.1.4

When a ToxiProxy server starts, by default it doesn’t do anything apart from running its HTTP API. By calling the API, you can configure and dynamically change the behavior of the proxy server. You can define arbitrary configurations defined by:

a unique name
a host and port to bind to and listen for connections
a destination server to proxy to
For every configuration like this, you can attach failures. In ToxiProxy lingo, these failures are called “toxics”. Currently, the following toxics are available:

latency - add arbitrary latency to the connection (in either direction)
down - take the connection down
bandwidth - throttle the connection to the desired speed
slow close - delay the TCP socket from closing for an arbitrary time
timeout - wait for an arbitrary time and then close the connection
slicer - slices the received data into smaller bits before sending it to the destination

You can attach an arbitrary combination of failures to every proxy configuration you define. For our needs, the latency toxic will do exactly what we want it to. Let’s see how all of this fits together.

NOTE POP QUIZ: WHAT’S TOXIPROXY?
Pick one:

1. A configurable TCP proxy, that can simulate various problems, like dropped packets or network slowness
 A K-pop band singing about the environmental consequences of dumping large amounts of toxic waste sent to third world countries through the use of proxy and shell companies

See appendix B for answers.

Experiment 2: implementation continued
To sum it all up, we want to create a new pod with two containers: one for Goldpinger and one for the ToxiProxy. We’ll need to configure Goldpinger to run on a different port, so that the proxy can listen on the default port 8080 that the other Goldpinger instances will try to connect to. We’ll also create a service that routes connections to the proxy API on port 8474, so that we can use toxiproxy-cli commands to configure the proxy and add the latency that we want,just like in figure 10.14.

Figure 10.14 Interacting with the modified version of Goldpinger using toxiproxy-cli

Let’s now translate this into a Kubernetes .yml file. You can see the resulting goldpinger-chaos.yml in listing 10.4. You will see two resource descriptions, a pod (with two containers) and a service. Note, that we use the same service account we created before, to give Goldpinger the same permissions. We’re also using two environment variables, PORT and CLIENT_PORT_OVERRIDE, to make Goldpinger listen on port 9090, but call its peers on port 8080, respectively. This is because by default, Goldpinger calls its peers on the same port that it runs itself. Finally, notice that the service is using a label chaos=absolutely to match to the new pod we created. It’s important that the Goldpinger pod has the label app=goldpinger, so that it can be found by its peers, but we also need another label to be able to route connections to the proxy API.



---
apiVersion: v1
kind: Pod
metadata:
  name: goldpinger-chaos
  namespace: default
  labels:
    app: goldpinger
    chaos: absolutely
spec:
  serviceAccount: "goldpinger-serviceaccount"
  containers:
  - name: goldpinger
    image: docker.io/bloomberg/goldpinger:v3.0.0
    env:
    - name: REFRESH_INTERVAL
      value: "2"
    - name: HOST
      value: "0.0.0.0"
    - name: PORT
      value: "9090"
    - name: CLIENT_PORT_OVERRIDE
      value: "8080"
    - name: POD_IP
      valueFrom:
        fieldRef:
          fieldPath: status.podIP
  - name: toxiproxy
    image: docker.io/shopify/toxiproxy:2.1.4
    ports:
    - containerPort: 8474
      name: toxiproxy-api
    - containerPort: 8080
      name: goldpinger
---
apiVersion: v1
kind: Service
metadata:
  name: goldpinger-chaos
  namespace: default
spec:
  type: LoadBalancer
  ports:
    - port: 8474
      name: toxiproxy-api
  selector:
    chaos: absolutely

    #A the new pod has the same label app=goldpinger to be detected by its peers, but also chaos=absolutely to be matched by the proxy api service

#B we use the same service account as other instances to give Goldpinger permission to list its peers

#C we use HOST envvar to make Goldpinger listen on port 9090, and CLIENT_PORT_OVERRIDE to make it call itse peers on the default port 8080

#D ToxiProxy container will expose two ports: 8474 with the ToxiProxy API and 8080 to proxy through to Goldpinger

#E the service will route traffic to port 8474 (ToxiProxy API)

#F the service will use label chaos=absolutely to select the pods running ToxiProxy

And that’s all we need. Make sure you have this file handy (or clone it from the repo like before). Ready to rock? Let the games begin!

Experiment 2: run!
To run this experiment, we’re going to use the Goldpinger UI. If you closed the browser window before, restart it by running the following command in the terminal:

minikube service goldpinger

Let’s start with the steady state, and confirm that all three nodes are visible and report as healthy. In the top bar, click Heatmap. You will see a heatmap similar to the one in figure 10.15. Each square represents connectivity between nodes and is color-coded based on the time it took to execute a request.

Columns represent source (from)
Rows represent destinations (to)
The legend clarifies which number corresponds to which pod.
In this example, all squares are the same color and shade, meaning that all requests took below 2ms, which is to be expected when all instances run on the same host. You can also tweak the values to your liking and click “refresh” to show a new heatmap. Close it when you’re ready.

Figure 10.15 Example of Goldpinger Heatmap


Let’s introduce our new pod! To do that, we’ll kubectl apply the goldpinger-chaos.yml file from listing 10.4. Run the following command:

kubectl apply -f goldpinger-chaos.yml

You will see an output confirming creation of a pod and service:

pod/goldpinger-chaos created
service/goldpinger-chaos created

Let’s confirm it’s running by going to the UI. You will now see an extra node, just like in figure 10.16. But notice that the new pod is marked as unhealthy - all of its peers are failing to connect to it. In the live UI, the node is marked in red, and in the figure 10.16 I annotated the new, unhealthy node for you. This is because we haven’t configured the proxy to pass the traffic yet.

Figure 10.16 Extra Goldpinger instance, detected by its peers, but inaccessible

Let’s address that by configuring the ToxiProxy. This is where the extra service we deployed comes in handy: we will use it to connect to the ToxiProxy API using toxiproxy-cli. Do you remember how we used minikube service to get a special URL to access the Goldpinger service? We’ll leverage that again, but this time with the --url flag, to only print the url itself. Run the following command in a bash session to store the url in a variable:

TOXIPROXY_URL=$(minikube service --url goldpinger-chaos)

We can now use the variable to point toxiproxy-cli to the right ToxiProxy API. That’s done using the -h flag. Confusingly, -h is not for “help”, it’s for “host”. Let’s confirm it works by listing the existing proxy configuration:

toxiproxy-cli -h $TOXIPROXY_URL list

You will see the following output, saying there are no proxies configured. It even goes so far as to hint we create some proxies (bold font):

Name       Listen          Upstream                Enabled         Toxics
no proxies
 
Hint: create a proxy with `toxiproxy-cli create`

Let’s configure one. We’ll call it chaos, make it route to localhost:9090 (where we configured Goldpinger to listen to) and listen on 0.0.0.0:8080 to make it accessible to its peers to call. Run the following command to make that happen:

toxiproxy-cli \ 
  -h $TOXIPROXY_URL \
  create chaos \
  -l 0.0.0.0:8080 \
  -u localhost:9090

  #A connect to specific proxy

#B create a new proxy configuration called “chaos”

#C listen on 0.0.0.0:8080 (default Goldpinger port)

#D relay connections to localhost:9090 (where we configured Goldpinger to run)

You will see a simple confirmation that the proxy was created:

Created new proxy chaos

Rerun the toxiproxy-cli list command to see the new proxy appear this time:

toxiproxy-cli -h $TOXIPROXY_URL list

You will see the following output, listing a new proxy configuration called “chaos” (bold font):

Name       Listen          Upstream                Enabled         Toxics 
  ================================================ 
  chaos      [::]:8080       localhost:9090          enabled         None 
  
Hint: inspect toxics with `toxiproxy-cli inspect <proxyName>`

If you go back to the UI and click refresh, you will see that the goldpinger-chaos extra instance is now green, and all instances happily report healthy state in all directions. If you check the heatmap, it will also show all green.

Let’s change that. Using the command toxiproxy-cli toxic add, let’s add a single toxic with 250ms latency. Do that by running the following command:

toxiproxy-cli \
-h $TOXIPROXY_URL \
toxic add \
--type latency \
--a latency=250 \
--upstream \
chaos

#A add a toxic to an existing proxy configuration

#B toxic type is latency

#C we want to add 250ms of latency

#D we set it in the upstream direction, towards the Goldpinger instance

#E we attach this toxic to a proxy configuration called “chaos”

You will see a confirmation:

Added upstream latency toxic 'latency_upstream' on proxy 'chaos'
To confirm that the proxy got it right, we can inspect our proxy called “chaos”. To do that, run the following command:
toxiproxy-cli -h $TOXIPROXY_URL inspect chaos

You will see an output just like the following, listing our brand new toxic (bold font):

Name: chaos     Listen: [::]:8080       Upstream: localhost:9090 
  ====================================================================== 
  Upstream toxics: 
  latency_upstream:       type=latency    stream=upstream toxicity=1.00   attributes=[    jitter=0        latency=250     ] 
  
  Downstream toxics: 
  Proxy has no Downstream toxics enabled.

  Now, go back to the Goldpinger UI in the browser and refresh. You will still see all four instances reporting healthy and happy (the 250ms delay fits within the default timeout of 300ms). But if you open the heatmap, this time it will tell a different story. The row with goldpinger-chaos pod will be marked in red (problem threshold), implying that all its peers detected slowness. See figure 10.17 for a screenshot.

Figure 10.17 Goldpinger heatmap, showing slowness accessing pod goldpinger-chaos

This means that our hypothesis was correct: Goldpinger correctly detects and reports the slowness, and at 250ms, below the default timeout of 300ms, the Goldpinger graph UI reports all as healthy. And we did all of that without modifying the existing pods.

This wraps up the experiment, but before we go, let’s clean up the extra pod. To do that, run the following command to delete everything we created using the goldpinger-chaos.yml file:

kubectl delete -f goldpinger-chaos.yml

Let’s discuss our findings.

Experiment 2: Discussion
How well did we do? We took some time to learn new tools, but the entire implementation of the experiment boiled down to a single .yml file and a handful of commands with ToxiProxy. We also had a tangible benefit of working on a copy of the software that we wanted to test, leaving the existing running processes unmodified. We effectively rolled out some extra capacity and then had 25% of running software affected, limiting the blast radius. Does it mean we could do that in production? As with any sufficiently complex question, the answer is, “it depends.” In this example, if we wanted to verify the robustness of some alerting that relies on metrics from Goldpinger to trigger, this could be a good way to do it. But the extra software could also affect the existing instances in a more profound way, making it more risky. At the end of the day, it really depends on your application.

There is, of course, room for improvement. For example, the service we’re using to access the Goldpinger UI is routing traffic to any instance matched in a pseudo-random fashion. That means that sometimes it will route to the instance that has the 250ms delay. In our case, that will be difficult to spot with the naked eye, but if you wanted to test a larger delay, it could be a problem.

Time to wrap up this first part. Coming in part 2: making your chaos engineer life easier with PowerfulSeal.



11 Automating Kubernetes experiments
This chapter covers
Automating chaos experiments for Kubernetes with PowerfulSeal
Recognizing the difference between one-off experiments and ongoing SLO verification
Designing chaos experiments on the VM level using cloud provider APIs
In this second helping of Kubernetes goodness, we’ll see how to use higher-level tools to implement chaos experiments. In the previous chapter we set things up manually to build the understanding of how to implement the experiment. But now that you know that, I want to show you how much more quickly you can go when using the right tools. Enter PowerfulSeal.

11.1 Automating chaos with PowerfulSeal

It’s often said that software engineering is one of the very few jobs where being lazy is a good thing. And I tend to agree with that; a lot of automation or reducing toil can be seen as a manifestation of being too lazy to do manual labor. Automation also reduces operator errors and improves speed and accuracy.

The tools for automation of chaos experiments are steadily becoming more advanced and mature. For a good, up-to-date list of available tools, it’s worth checking out the Awesome Chaos Engineering list (https://github.com/dastergon/awesome-chaos-engineering). For Kubernetes, I recommend PowerfulSeal (https://github.com/powerfulseal/powerfulseal), created by yours truly, that we’re going to use here. Other good options include Chaos Toolkit (https://github.com/chaostoolkit/chaostoolkit) and Litmus (https://litmuschaos.io/).

In this section, we’re going to build on the two experiments we implemented manually to make you more efficient the next time. In fact, we’re going to re-implement a slight variation of these experiments, each in 5 minutes flat. So, what’s PowerfulSeal again?

11.1.1   What’s PowerfulSeal?
PowerfulSeal is a chaos engineering tool for Kubernetes. It has quite a few features:

interactive mode helping you understand how software on your cluster works and manually break it
integrating with your cloud provider to take VMs up and down
automatically killing pods marked with special labels
autonomous mode supporting sophisticated scenarios
The latter point in this list is the functionality we’ll focus on here.

The autonomous mode allows you to implement chaos experiments by writing a simple .yml file. Inside that file, you can write any number of scenarios, each listing the steps necessary to implement, validate, and clean up after your experiment. There are plenty of options you can use (documented at https://powerfulseal.github.io/powerfulseal/policies), but at its heart, it’s a very simple format. The .yml file containing scenarios is referred to as a policy file.

To give you an example, take a look at listing 11.1. It contains a simple policy file, with a single scenario, with a single step. That single step is an HTTP probe. It will try to make an HTTP request to the designated endpoint of the specified service, and fail the scenario if that doesn’t work.

scenarios:
- name: Just check that my service responds
  steps:
  - probeHTTP:
      target:
        service:
          name: my-service
          namespace: myapp
      endpoint: /healthz

#A instruct PowerfulSeal to conduct an HTTP probe

#B target service my-service in namespace myapp

#C call the /healthz endpoint on that service

Once you have your policy file ready, there are many ways you can run PowerfulSeal. Typically, it tends to be used either from your local machine -- the same one you use to interact with the Kubernetes cluster (useful for development) -- or as a Deployment running directly on the cluster (useful for ongoing, continuous experiments).

To run, PowerfulSeal needs permission to interact with the Kubernetes cluster, either through a ServiceAccount, like we did with Goldpinger in chapter 10, or through specifying a kubectl config file. If you want to manipulate VMs in your cluster, you’ll also need to configure access to the cloud provider. With that, you can start PowerfulSeal in autonomous mode and let it execute your scenario. PowerfulSeal will go through the policy and execute scenarios step by step, killing pods and taking down VMs as appropriate. Take a look at figure 11.1 that shows what this setup looks like visually.

Figure 11.1 Setting up PowerfulSeal

And that’s it. Point it at a cluster, tell it what your experiment is like, and watch it do the work for you! We’re almost ready to get our hands dirty, but before we do, we’ll need to install PowerfulSeal.

NOTE POP QUIZ: WHAT DOES POWEFULSEAL DO?
Pick one:

1. Illustrates - in equal measures - the importance and futility of trying to pick up good names in software

2. Guesses what kind of chaos you might need by looking at your Kubernetes clusters

3. Allows you to write a Yaml file to describe how to run and validate chaos experiments

See appendix B for answers.

11.1.2   PowerfulSeal - installation
PowerfulSeal is written in Python, and it’s distributed in two forms:

a pip package called powerfulseal
a Docker image called powerfulseal/powerfulseal on Docker Hub
For the two examples we’re going to run, it will be much easier to run PowerfulSeal locally, so let’s install it through pip. It requires Python3.7+ and pip available.

To install it using a virtualenv (recommended), run the following commands in a terminal window to create a subfolder called env and install everything in it:

python3 --version
  python3 -m virtualenv env
  source env/bin/activate
  pip install powerfulseal

  #A check the version to make sure it’s python3.7

#B create a new virtualenv in the current working directory, called env

#C activate the new virtualenv

#D install powerfulseal from pip

Depending on your internet connection, the last step might take a minute or two. When it’s done, you will have a new command accessible, called powerfulseal. Try it out by running the following command:

powerfulseal --version

You will see the version printed, corresponding to the latest version available. If, at any point, you need help, feel free to consult the help pages of PowerfulSeal, by running the following command:

powerfulseal --help

With that, we’re ready to roll. Let’s see what experiment 1 would look like using PowerfulSeal.

11.1.3   Experiment 1b: kill 50% of pods
As a reminder, this was our plan for experiment 1:

Observability: use Goldpinger UI to see if there are any pods marked as inaccessible; use kubectl to see new pods come and go
Steady state: all nodes healthy
Hypothesis: if we delete one pod, we should see it in marked as failed in Goldpinger UI, and then be replaced by a new, healthy pod
Run the experiment
We have already covered the observability, but if you closed the browser window with the Goldpinger UI, here’s a refresher. Open the Goldpinger UI by running the following command in a terminal window:

minikube service goldpinger

And just like before, we’d like to have a way to see what pods were created and deleted. To do that, we leverage the --watch flag of the kubectl get pods command. In another terminal window, start a kubectl command to print all changes:

kubectl get pods --watch

Now, to the actual experiment. Fortunately, it translates one-to-one to a built-in feature of PowefulSeal. Actions on pods are done using PodAction (I’m good at naming like that). Every PodAction consists of three steps:

match some pods, for example based on labels
filter the pods (various filters available, for example take a 50% subset)
apply an action on pods (for example, kill them)
This translates directly into experiment1b.yml that you can see in listing 11.2. Store it or clone it from the repo.

config:
  runStrategy:
    runs: 1
scenarios:
- name: Kill 50% of Goldpinger nodes
  steps:
  - podAction:
      matches:
        - labels:
            selector: app=goldpinger
            namespace: default
      filters:
        - randomSample:
            ratio: 0.5
      actions:
        - kill:
            force: true

#A only run the scenario once, and then exit

#B select all pods in namespace default, with labels app=goldpinger

#C filter out to only take 50% of the matched pods

#D kill the pods

You must be itching to run it, so let’s not wait any longer. On Minikube, the kubectl config is stored in ~/.kube/config, and it will be automatically picked up when you run PowerfulSeal. So the only argument we need to specify is the policy file (--policy-file) flag. Run the following command, pointing to the experiment1b.yml file:

powerfulseal autonomous --policy-file experiment1b.yml

You will see an output similar to the following (abbreviated). Note the lines when it says it found three pods, filtered out two and selected a pod to be killed (bold font):

(...) 
  2020-08-25 09:51:20 INFO __main__ STARTING AUTONOMOUS MODE 
  2020-08-25 09:51:20 INFO scenario.Kill 50% of Gol Starting scenario 'Kill 50% of Goldpinger nodes' (1 steps) 
  2020-08-25 09:51:20 INFO action_nodes_pods.Kill 50% of Gol Matching 'labels' {'labels': {'selector': 'app=goldpinger', 'namespace': 'default'}} 
  2020-08-25 09:51:20 INFO action_nodes_pods.Kill 50% of Gol Matched 3 pods for selector app=goldpinger in namespace default 
  2020-08-25 09:51:20 INFO action_nodes_pods.Kill 50% of Gol Initial set length: 3 
  2020-08-25 09:51:20 INFO action_nodes_pods.Kill 50% of Gol Filtered set length: 1 
  2020-08-25 09:51:20 INFO action_nodes_pods.Kill 50% of Gol Pod killed: [pod #0 name=goldpinger-c86c78448-8lfqd namespace=default containers=1 ip=172.17.0.3 host_ip=192.168.99.100 state=Running labels:app=goldpinger,pod-template-hash=c86c78448 annotations:] 
  2020-08-25 09:51:20 INFO scenario.Kill 50% of Gol Scenario finished 
  (...)

  If you’re quick enough, you will see a pod becoming unavailable and then replaced by a new pod in the Goldpinger UI, just like you did the first time we ran this experiment. And in the terminal window running kubectl, you will see the familiar sight, confirming that a pod was killed (goldpinger-c86c78448-8lfqd) and then replaced with a new one (goldpinger-c86c78448-czbkx):

  NAME            READY   STATUS    RESTARTS   AGE 
  goldpinger-c86c78448-lwxrq   1/1     Running   1          45h 
  goldpinger-c86c78448-tl9xq   1/1     Running   0          40m 
  goldpinger-c86c78448-xqfvc   1/1     Running   0          8m33s 
  goldpinger-c86c78448-8lfqd   1/1     Terminating   0          41m 
  goldpinger-c86c78448-8lfqd   1/1     Terminating   0          41m 
  goldpinger-c86c78448-czbkx   0/1     Pending       0          0s 
  goldpinger-c86c78448-czbkx   0/1     Pending       0          0s 
  goldpinger-c86c78448-czbkx   0/1     ContainerCreating   0          0s 
  goldpinger-c86c78448-czbkx   1/1     Running             0          2s

  That concludes the first experiment and shows you the ease of use of higher level tools like PowerfulSeal. But we’re just warming up. Let’s take a look at experiment 2 once again, this time using the new toys.

11.1.4   Experiment 2b: network slowness
As a reminder, this was our plan for experiment 2:

Observability: use Goldpinger UI to read delays using the graph UI and the heatmap
Steady state: all existing Goldpinger instances report healthy
Hypothesis: if we add a new instance that has a 250ms delay, the connectivity graph will show all four instances healthy, and the 250ms delay will be visible in the heatmap
Run the experiment!

It’s a perfectly good plan, so let’s use it again. But this time, instead of manually setting up a new deployment and doing the gymnastics to point the right port to the right place, we’ll leverage the clone feature of PowerfulSeal.

It works like this. You point it at a source deployment that it will copy at runtime (the deployment must exist on the cluster). This is to make sure that we don’t break the existing running software, and instead add an extra instance, just like we did before. And then you can specify a list of mutations that PowerfulSeal will apply to the deployment to achieve specific goals. Of particular interest is the toxiproxy mutation. It does almost exactly the same thing that we did:

add a toxiproxy container to the deployment
configure toxiproxy to create a proxy configuration for each port specified on the deployment
automatically redirect the traffic incoming to each port specified in the original deployment to its corresponding proxy port
configure any toxics requested

The only real difference between what we did before and what PowefulSeal does is the automatic redirection of ports, which means that we don’t need to change any ports configuration in the deployment.

To implement this scenario using PowerfulSeal, we need to write another policy file. It’s pretty straightforward. We need to use the clone feature, and specify the source deployment to clone. To introduce the network slowness, we can add a mutation of type toxiproxy, with a toxic on port 8080, of type latency, with the latency attribute set to 250ms. And just to show you how easy it is to use, let’s set the number of replicas affected to 2. That means that two replicas out of the total of five (three from the original deployment plus these two), or 40% of the traffic will be affected. Also note that at the end of a scenario, PowerfulSeal cleans up after itself by deleting the clone it created. To give you enough time to look around, let’s add a wait of 120 seconds before that happens.

When translated into Yaml, it looks like the file experiment2b.yml that you can see in listing 11.3. Take a look.

config:
  runStrategy:
    runs: 1
scenarios:
- name: Toxiproxy latency
  steps:
  - clone:
source:
        deployment:
          name: goldpinger
          namespace: default
      replicas: 2
      mutations:
        - toxiproxy:
            toxics:
              - targetProxy: "8080"
                toxicType: latency
                toxicAttributes:
     - name: latency
       value: 250
  - wait:
      seconds: 120

      #A use the clone feature of PowerfulSeal

#B clone the deployment called “goldpinger” in the default namespace

#C use two replicas of the clone

#D target port 8080 (the one that Goldpinger is running on)

#E specify latency of 250ms

#F wait for 120 seconds

NOTE BRINGING GOLDPINGER BACK UP AGAIN
If you got rid of the Goldpinger deployment from experiment 2, you can bring it back up by running the following command in a terminal window:

kubectl apply -f goldpinger-rbac.yml

kubectl apply -f goldpinger.yml

You’ll see a confirmation of the created resources. After a few seconds, you will be able to see the Goldpinger UI in the browser by running the following command:

minikube service goldpinger

You will see the familiar graph with three goldpinger nodes, just like in chapter 10. See figure 11.2 for a reminder of what it looks like.

Figure 11.2 Goldpinger UI in action

Let’s execute the experiment. Run the following command in a terminal window:

powerfulseal autonomous --policy-file experiment2b.yml

You will see PowerfulSeal creating the clone, and then eventually deleting it, similar to the following output:

(...)
2020-08-31 10:49:32 INFO __main__ STARTING AUTONOMOUS MODE 
  2020-08-31 10:49:33 INFO scenario.Toxiproxy laten Starting scenario 'Toxiproxy latency' (2 steps) 
  2020-08-31 10:49:33 INFO action_clone.Toxiproxy laten Clone deployment created successfully 
  2020-08-31 10:49:33 INFO scenario.Toxiproxy laten Sleeping for 120 seconds 
  2020-08-31 10:51:33 INFO scenario.Toxiproxy laten Scenario finished 
  2020-08-31 10:51:33 INFO scenario.Toxiproxy laten Cleanup started (1 items) 
  2020-08-31 10:51:33 INFO action_clone Clone deployment deleted successfully: goldpinger-chaos in default 
  2020-08-31 10:51:33 INFO scenario.Toxiproxy laten Cleanup done 
  2020-08-31 10:51:33 INFO policy_runner All done here!

  During the 2-minute wait you configured, check the Goldpinger UI. You will see a graph with five nodes. When all pods come up, the graph will show all healthy. But there is more to it. Click the heatmap, and you will see that the cloned pods (they will have “chaos” in their name) are slow to respond. But if you look closely, you will notice that the connections they are making to themselves are unaffected. That’s because PowerfulSeal doesn’t inject itself into communications on localhost. Click the heatmap button. You will see a heatmap similar to figure 11.2. Note that the squares on the diagonal (pods calling themselves) remain unaffected by the added latency.

Figure 11.3 Goldpinger heatmap showing two pods with added latency, injected by PowerfulSeal

That concludes the experiment. Wait for PowerfulSeal to clean up after itself and delete the cloned deployment. When it’s finished (it will exit(, let’s move on to the next topic: ongoing testing.

11.2 Ongoing testing & Service Level Objectives (SLOs)
So far, all the experiments we’ve conducted were designed to verify a hypothesis and call it a day. Like everything in science, a single counter-example is enough to prove a hypothesis wrong, but absence of such counter-example doesn’t prove anything. And sometimes our hypotheses are about normal functioning of a system, where various events might occur and influence the outcome.

To illustrate what I mean, let me give you an example. Think of a typical Service Level Agreement (SLA) that you might see for a Platform as a Service (PaaS). Let’s say that your product is to offer managed services, similar to AWS Lambda (https://aws.amazon.com/lambda/), where the client can make an API call specifying a location of some code, and your platform will build, deploy, and run that service for them. Your clients care deeply about the speed at which they can deploy new versions of their services, so they want an SLA for the time it takes from their request to their service being ready to serve traffic. To keep things simple, let’s say that the time for building their code is excluded, and the time to deploy it on your platform is agreed to be one minute.

As the engineer responsible for that system, you need to work backward from that constraint to set up the system in a way that can satisfy these requirements. You design an experiment to verify that a typical request you expect to see in your clients fits in that timeline. You run it, turns out it only takes about 30 seconds, the champagne cork is popping and the party starts! Or does it?

When you run the experiment like this and it works, what you actually proved is that the system behaved the expected way during the experiment. But does it guarantee that it will work the same way in different conditions (peak traffic, different usage patterns, different data)? Typically, the larger and more complex the system is, the harder it is to answer that question. And that’s a problem, especially if the SLAs you signed have financial penalties for missing the goals.

Fortunately, chaos engineering really shines in this scenario. Instead of running an experiment once, we can run it continuously to detect any anomalies, experimenting every time on a system in a different state and during the kind of failure we expect to see. Simple yet effective.

Let’s go back to our example. We have a 1-minute deadline to start a new service. Let’s automate an ongoing experiment that starts a new service every few minutes, measures the time it took to become available, and alerts if it exceeds a certain threshold. That threshold will be our internal SLO, which is more aggressive than the legally binding version in the SLA that we signed, so that we can get alerted when we get close to trouble.

It’s a common scenario, so let’s take our time and make it real.

11.2.1   Experiment 3: verify pods are ready within (n) seconds of being created
Chances are, that PaaS you’re building is running on Kubernetes. When your client makes a request to your system, it translates into a request for Kubernetes to create a new deployment. You can acknowledge the request to your client, but this is where things start getting tricky. How do you know that the service is ready? In one of the previous experiments we used kubectl get pods --watch to print to the console all changes to the state of the pods we cared about. All of them are happening asynchronously, in the background, while Kubernetes is trying to converge to the desired state. In Kubernetes, pods can be in one of the following states:

pending - the pod has been accepted by Kubernetes, but it’s not been setup yet
running - the pod has been setup, and at least one container is still running
succeeded - all containers in the pod have terminated in success
failed - all containers in the pod have terminated, at least one of them in failure
unknown - the state of the pod is unknown (typically the node running it stopped reporting its state to Kubernetes)

If everything goes well, the happy path is for a pod to start in pending, and then move to running. But before that happens, a lot of things need to happen, many of which will take a different amount of time every time.; for example:

image download - unless already present on the host, the images for each container need to be downloaded, potentially from a remote location. Depending on the size of the image and on how busy the location from which it needs to be downloaded is at the time, it might take a different amount of time every time. Additionally, like everything on the network, it’s prone to failure and might need to be retried.
preparing dependencies - before a pod is actually run, Kubernetes might need to prepare some dependencies it relies on, like (potentially large) volumes, configuration files and so on
actually running the containers - the time to actually start a container will vary, depending on how busy the host machine is

In a not-so-happy path, for example, if an image download gets interrupted, you might end up with a pod going from pending through failed to running. The point is that it can’t easily be predicted how long it’s going to take to actually have it running. So the next best thing we can do is to continuously test it and alert when it gets too close to the threshold we care about.

With PowerfulSeal, it’s very easy to do. We can write a policy that will deploy some example application to run on the cluster, wait the time we expect it to take, and then execute an HTTP request to verify that the application is running correctly. It can also automatically clean the application up when it’s done, and provide means to get alerted when the experiment failed.

Normally, we would add some type of failure, and test that the system withstands that. But right now I just want to illustrate the idea of ongoing experiments, so let’s keep it simple and stick to just verifying our SLO on the system without any disturbance.

Leveraging that, we can design the following experiment:

Observability: read PowerfulSeal output (and/or metrics)
Steady state: N/A
Hypothesis: when I schedule a new pod and a service, it becomes available for HTTP calls within 30 seconds
Run the experiment!
That translates into a PowerfulSeal policy that runs indefinitely the following steps:

create a pod and a service
wait 30 seconds
make a call to the service to verify it’s available, fail if it’s not
clean up (remote the pod and service)
rinse and repeat
Take a look at figure 11.3 that shows this process visually.

Figure 11.4 Example of an ongoing chaos experiment

To write the actual PowerfulSeal policy file, we’re going to use three more features:

First, a step of type kubectl behaves just like you expect it to: it executes the attached Yaml just like if you did a kubectl apply or kubectl delete. We’ll use that to create the pods in question. We’ll also use the option for automatic clean up at the end of the scenario, called autoDelete.
Second, we’ll use the wait feature to wait for the 30 seconds we expect to be sufficient to deploy and start the pod.
Third, we’ll use the probeHTTP to make an HTTP request and detect whether it works. probeHTTP is fairly flexible; it supports calling services or arbitrary urls, using proxies and more.
We’ll also need an actual test app to deploy and call. Ideally, we’d choose something that represents a reasonable approximation of the type of software that the platform is supposed to handle. To keep things simple, we can deploy a simple version of Goldpinger again. It has an endpoint /healthz that we can reach to confirm that it started correctly.

# Listing 11.4 experiment3.yml TODO
