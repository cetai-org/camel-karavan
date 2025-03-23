# Milestone 3 High Level Activity Diagram
Refer mileston3.plantuml 
# Custom Kamelet 
Custom Kamelets are placed in the local kamelet directory "kamelet"
Steps to run and test testkamelet.camel.yaml and transition.camel.yaml.
In the below, replace %WorkDir% with your working directory till cetai-org. Mine %WorkDir% is /home/emil/work/cetai-org
1.  cd %WorkDir%/camel-karavan/cetai/milestone3/model/productpnr-model  
    mvn clean install
2.  cd %WorkDir%/camel-karavan/cetai/milestone3/model/sabreinventory-model  
    mvn clean install
3.  cd %WorkDir%/camel-karavan/cetai/milestone3/adjustinventory-util  
    mvn clean install
4.  cd %WorkDir%/camel-karavan/cetai/milestone3/transition/transition-quarkus  
    mvn clean install
5.  cd %WorkDir%/camel-karavan/cetai/milestone3  
    camel run testkamelet.camel.yaml --local-kamelet-dir=%WorkDir%/camel-karavan/cetai/milestone3/kamelet --runtime=quarkus
6.  wiremock downloaded and executed   
    curl -XPOST http://localhost:8090/mock/createsession
7.  In %WorkDir%/camel-karavan/cetai/milestone3/kamelet/sabreinventorymark-sink.kamelet.yaml  
    disableFeatures: FAIL_ON_IGNORED_PROPERTIES,FAIL_ON_UNKNOWN_PROPERTIES
8.  cd %WorkDir%/camel-karavan/cetai/milestone3/transition  
    camel run transition.camel.yaml --local-kamelet-dir=%WorkDir%/camel-karavan/cetai/milestone3/kamelet --runtime=quarkus
    curl -X POST -H "Content-Type: application/json" -d '{"pos": {"city": "SFO","country": "US"}}' http://localhost:8080/transition/create-pnr
