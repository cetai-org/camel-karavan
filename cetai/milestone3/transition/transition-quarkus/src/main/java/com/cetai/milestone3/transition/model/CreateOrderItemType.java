package com.cetai.milestone3.transition.model;

public class CreateOrderItemType {

    private String offerItemRefId;

    private String orderItemRefId;

    private String orderItemUuid;

    private OrderItemType offerItemType;

    public String getOfferItemRefId() {
        return offerItemRefId;
    }

    public void setOfferItemRefId(String offerItemRefId) {
        this.offerItemRefId = offerItemRefId;
    }

    public String getOrderItemRefId() {
        return orderItemRefId;
    }

    public void setOrderItemRefId(String orderItemRefId) {
        this.orderItemRefId = orderItemRefId;
    }

    public String getOrderItemUuid() {
        return orderItemUuid;
    }

    public void setOrderItemUuid(String orderItemUuid) {
        this.orderItemUuid = orderItemUuid;
    }

    public OrderItemType getOfferItemType() {
        return offerItemType;
    }

    public void setOfferItemType(OrderItemType offerItemType) {
        this.offerItemType = offerItemType;
    }

    
}
