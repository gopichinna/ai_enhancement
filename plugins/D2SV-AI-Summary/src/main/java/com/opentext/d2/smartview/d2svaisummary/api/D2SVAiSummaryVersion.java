package com.opentext.d2.smartview.d2svaisummary.api;

import com.emc.common.java.utils.IVersion;

import java.util.Locale;
import java.util.ResourceBundle;

public final class D2SVAiSummaryVersion implements IVersion {

    @Override
    public String getFullName() {
        return getProductName() + " v" + getVersion();
    }

    @Override
    public String getProductName() {
        return getBundle().getString("plugin.name");
    }

    @Override
    public String getVersion() {
        return getBundle().getString("plugin.version");
    }

    @Override
    public String getPackage() {
        return getBundle().getString("plugin.package");
    }

    @Override
    public String toString() {
        return getFullName();
    }

    private ResourceBundle getBundle() {
        return ResourceBundle.getBundle("d2svaisummary-version", Locale.getDefault());
    }
}
