package com.opentext.d2.smartview.d2svaisummary;

import com.emc.common.java.utils.IVersion;
import com.emc.d2fs.dctm.web.services.ID2fsPlugin;
import com.opentext.d2.smartview.d2svaisummary.api.D2SVAiSummaryVersion;

public class D2SVAiSummaryPlugin implements ID2fsPlugin {
    private static final IVersion VERSION = new D2SVAiSummaryVersion();

    @Override
    public String getFullName() {
        return VERSION.getFullName();
    }

    @Override
    public String getProductName() {
        return VERSION.getProductName();
    }
}
