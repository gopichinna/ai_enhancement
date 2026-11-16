package com.emc;

import com.opentext.d2.smartview.d2svaisummary.api.D2SVAiSummaryVersion;
import com.emc.common.java.utils.IVersion;

public final class D2PluginVersion implements IVersion {
    private static final IVersion VERSION = new D2SVAiSummaryVersion();

    @Override
    public String getFullName() {
        return VERSION.getFullName();
    }

    @Override
    public String getProductName() {
        return VERSION.getProductName();
    }

    @Override
    public String getVersion() {
        return VERSION.getVersion();
    }

    @Override
    public String getPackage() {
        return VERSION.getPackage();
    }

    @Override
    public String toString() {
        return getFullName();
    }
}
