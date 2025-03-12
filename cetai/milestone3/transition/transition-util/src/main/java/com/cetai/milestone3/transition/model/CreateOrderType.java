package com.cetai.milestone3.transition.model;

import java.util.Date;

public class CreateOrderType {

    private AcceptOrderItemListType acceptOrderItemList;

    private String offerId;

    private String orderId;

    private Date orderCreationTime;

    public AcceptOrderItemListType getAcceptOrderItemList() {
        return acceptOrderItemList;
    }

    public void setAcceptOrderItemList(AcceptOrderItemListType acceptOrderItemList) {
        this.acceptOrderItemList = acceptOrderItemList;
    }

    public String getOfferId() {
        return offerId;
    }

    public void setOfferId(String offerId) {
        this.offerId = offerId;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public Date getOrderCreationTime() {
        return orderCreationTime;
    }

    public void setOrderCreationTime(Date orderCreationTime) {
        this.orderCreationTime = orderCreationTime;
    }

    
}
