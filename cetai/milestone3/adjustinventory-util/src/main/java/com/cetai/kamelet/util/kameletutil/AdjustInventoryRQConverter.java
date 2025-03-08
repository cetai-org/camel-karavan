package com.cetai.kamelet.util.kameletutil;

import org.apache.camel.Exchange;
import org.apache.camel.Processor;
import com.cetai.kamelet.sabreinventory.model.AdjustInventoryRQ;
import com.cetai.kamelet.sabreinventory.model.SessionCreateRS;

import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.inject.Named;

@RegisterForReflection
@Named("adjustInventoryProcessor")
public class AdjustInventoryRQConverter implements Processor{

    @Override
    public void process(Exchange exchange) throws Exception {
        SessionCreateRS sessionCreateRS = (SessionCreateRS) exchange.getIn().getBody();
        AdjustInventoryRQ adjustInventoryRQ=new AdjustInventoryRQ();
        adjustInventoryRQ.setSessionId(sessionCreateRS.getConversationid());
        exchange.getIn().setBody(adjustInventoryRQ);
        
    }

    

}
