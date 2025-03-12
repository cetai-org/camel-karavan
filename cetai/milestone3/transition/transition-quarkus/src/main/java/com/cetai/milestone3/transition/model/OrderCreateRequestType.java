package com.cetai.milestone3.transition.model;

public class OrderCreateRequestType {

    private CreateOrderType createOrder;

    private DataListsType dataLists;

    public CreateOrderType getCreateOrder() {
        return createOrder;
    }

    public void setCreateOrder(CreateOrderType createOrder) {
        this.createOrder = createOrder;
    }

    public DataListsType getDataLists() {
        return dataLists;
    }

    public void setDataLists(DataListsType dataLists) {
        this.dataLists = dataLists;
    }

    

}
