package com.cetai.kamelet.sabreinventory.model;
// package com.cetai.productpnr.model;
public class ProductPnrVO {

    private String tenant;

    private String posCity;

    private String ibeSessionId;

    public String getTenant() {
        return tenant;
    }

    public void setTenant(String tenant) {
        this.tenant = tenant;
    }

    public String getIbeSessionId() {
        return ibeSessionId;
    }

    public void setIbeSessionId(String ibeSessionId) {
        this.ibeSessionId = ibeSessionId;
    }

    public String getPosCity() {
        return posCity;
    }

    public void setPosCity(String posCity) {
        this.posCity = posCity;
    }

    

}
