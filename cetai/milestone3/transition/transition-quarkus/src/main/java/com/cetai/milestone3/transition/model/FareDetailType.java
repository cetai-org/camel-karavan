package com.cetai.milestone3.transition.model;

import java.util.List;

public class FareDetailType {

    private String accountCode;

    private List<FareComponentType> fareComponent;

    public String getAccountCode() {
        return accountCode;
    }

    public void setAccountCode(String accountCode) {
        this.accountCode = accountCode;
    }

    public List<FareComponentType> getFareComponent() {
        return fareComponent;
    }

    public void setFareComponent(List<FareComponentType> fareComponent) {
        this.fareComponent = fareComponent;
    }

    

}
