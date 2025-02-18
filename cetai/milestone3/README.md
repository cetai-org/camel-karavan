# Milestone 3 High Level Activity Diagram
Refer mileston3.plantuml 
# Custom Kamelet 
Custom Kamelets are placed in the local kamelet directory "kamelet"
A sample test kamelet script testkamelet.camel.yaml can be called in camel jbang runtime using the command

````bash
camel run --local-kamelet-dir=/home/bittu/work/cetai-org/milestone3/kamelet testkamelet.camel.yaml
````