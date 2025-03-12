package com.cetai.kamelet.util.kameletutil;

import org.apache.camel.Exchange;
import org.apache.camel.Processor;
import com.cetai.kamelet.sabreinventory.model.ProductPnrVO;
import com.cetai.kamelet.sabreinventory.model.SessionCreateRQ;
import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.inject.Named;

@RegisterForReflection
@Named("productPnrProcessor")
public class ProductPnrProcessor implements Processor{

    @Override
    public void process(Exchange exchange) throws Exception {
        ProductPnrVO productPnrVO = (ProductPnrVO) exchange.getIn().getBody();
        SessionCreateRQ sessionCreateRQ=new SessionCreateRQ();
        sessionCreateRQ.setPosCity(productPnrVO.getPosCity());
        
        exchange.getIn().setBody(sessionCreateRQ);
        
    }

    

}
