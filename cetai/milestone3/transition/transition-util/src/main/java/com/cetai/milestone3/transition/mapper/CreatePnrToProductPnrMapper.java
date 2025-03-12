package com.cetai.milestone3.transition.mapper;

import org.apache.camel.Exchange;
import org.apache.camel.Processor;

import com.cetai.milestone3.transition.model.CreatePnrRQ;
import com.cetai.milestone3.transition.model.productpnr.ProductPnrVO;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class CreatePnrToProductPnrMapper implements Processor{

    @Override
    public void process(Exchange exchange) throws Exception {

         CreatePnrRQ createPnrRQ = (CreatePnrRQ) exchange.getIn().getBody();
         ProductPnrVO productPnrVO=new ProductPnrVO();
        // sessionCreateRQ.setPosCity(productPnrVO.getPosCity());
        
        exchange.getIn().setBody(productPnrVO);
        
    }

}
