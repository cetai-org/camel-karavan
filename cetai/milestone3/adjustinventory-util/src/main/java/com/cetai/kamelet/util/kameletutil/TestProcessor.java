package com.cetai.kamelet.util.kameletutil;

import org.apache.camel.Exchange;
import org.apache.camel.Processor;

import jakarta.enterprise.context.ApplicationScoped;



@ApplicationScoped
public class TestProcessor implements Processor{

    @Override
    public void process(Exchange exchange) throws Exception {
       System.out.println(" testing the process is working");
    }

}
