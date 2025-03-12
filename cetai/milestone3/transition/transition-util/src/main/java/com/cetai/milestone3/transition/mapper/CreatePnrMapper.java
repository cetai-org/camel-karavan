package com.cetai.milestone3.transition.mapper;


import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.cetai.milestone3.transition.model.CreatePnrRQ;
import com.cetai.milestone3.transition.model.productpnr.ProductPnrVO;

@Mapper(componentModel = "cdi")
public interface CreatePnrMapper {
    @Mapping(source = "pos.city", target = "posCity")
    @Mapping(source = "request.createOrder.offerId", target = "offerid")
    @Mapping(source = "request.createOrder.orderId", target = "orderid")
    // @Mapping(source = "power", target = "electric")
    ProductPnrVO toProductPnrVO(CreatePnrRQ createPnrRQ);

}