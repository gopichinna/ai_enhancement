/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([ "nuc/lib/underscore", "nuc/lib/marionette3", "csui/utils/contexts/factories/branding.config.factory", "csui/utils/url", "csui/utils/node.links/node.links", "csui/utils/contexts/factories/application.scope.factory", "smart/themes/theming", "csui/utils/commonconfig.util", "i18n!csui/pages/start/nls/lang" ], function(_, Marionette, BrandingConfigFactory, Url, NodeLinks, ApplicationScopeModelFactory, theming, CommonConfigUtil, lang) {
  "use strict";
  const isJato = () => theming.isJATOTheme();
  const getDefaultLogo = () => {
    return isJato() ? `data:image/svg+xml,%3Csvg%20width%3D%2226%22%20height%3D%2232%22%20viewBox%3D%220%200%2026%2032%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%3Cpath%20d%3D%22M16.7189%204.00535H20.801C21.0366%204.00535%2021.2283%204.19243%2021.2283%204.42227V7.04139C21.2283%207.27124%2021.4201%207.45831%2021.6557%207.45831H25.5707C25.9104%207.45831%2026.1159%207.82446%2025.9296%208.10241L24.2228%2010.6708C24.1434%2010.791%2024.0091%2010.8605%2023.8639%2010.8605H21.6201C21.3845%2010.8605%2021.1927%2011.0476%2021.1927%2011.2774V18.1593C21.1599%2019.1669%2021.1599%2020.0168%2022.4831%2020.0168L23.8146%2019.9687C24.0584%2019.9606%2024.2584%2020.1504%2024.2584%2020.3856V23.3708C24.2584%2023.5766%2024.1023%2023.753%2023.8913%2023.7851C23.0338%2023.9107%2022.4393%2023.9829%2021.6448%2023.9829C19.9352%2023.9829%2018.0613%2023.8893%2016.9983%2022.3766C16.3216%2021.4012%2016.2887%2020.2359%2016.2887%2018.6618V4.41692C16.2887%204.18708%2016.4805%204%2016.7161%204L16.7189%204.00535Z%22%20fill%3D%22%231A6AFF%22%2F%3E%0A%3Cpath%20d%3D%22M9.19011%207.1829C3.98201%206.86219%20-0.31105%2011.0501%200.0177095%2016.1307C0.288936%2020.3213%203.77379%2023.7181%208.06959%2023.9827C13.2777%2024.3034%2017.5707%2020.1155%2017.242%2015.0349C16.9708%2010.8443%2013.4859%207.44749%209.19285%207.18023L9.19011%207.1829ZM9.13258%2019.3324C6.59839%2019.6451%204.46693%2017.5659%204.78473%2015.0911C5.00116%2013.4073%206.39839%2012.0443%208.12438%2011.8332C10.6586%2011.5205%2012.79%2013.6024%2012.4722%2016.0746C12.2558%2017.7583%2010.8586%2019.1186%209.13258%2019.3324Z%22%20fill%3D%22%231A6AFF%22%2F%3E%0A%3C%2Fsvg%3E%0A` : `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIyIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMTIyIDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTYuMTQ3MiAxMC42MTQ4QzE2LjE0NzIgMTQuNDEyNyAxMy45NjMyIDE4LjUzMTkgOC4xMTc3NyAxOC41MzE5QzMuODU0MTMgMTguNTQ3OSAtMS44Mzc3OWUtMDcgMTYuMTM5MSAtMS44Mzc3OWUtMDcgMTAuNjE0OEMtMS44Mzc3OWUtMDcgNi4wMTM5NSAyLjkwNjY2IDIuNDcyOTcgOC42NjM3NyAyLjc4NjEyQzE0Ljc5MDIgMy4xMzEzOSAxNi4xNDcyIDcuODc2NzggMTYuMTQ3MiAxMC42MTQ4Wk01LjIxMTExIDcuNzI0MjNDNC42OTA1NyA4LjU4NzU2IDQuNDMxMjEgOS41ODMxNyA0LjQ2NDM3IDEwLjU5MDdDNC40NjQzNyAxMi45MTkzIDUuNjEyNTggMTUuMDMxIDguMDkzNjggMTUuMDMxQzEwLjU3NDggMTUuMDMxIDExLjY1ODcgMTMuMDg3OSAxMS42NTg3IDEwLjc4MzRDMTEuNzE0NCAxMC4xMTg1IDExLjYzMzUgOS40NDkyNiAxMS40MjA4IDguODE2ODJDMTEuMjA4MiA4LjE4NDM3IDEwLjg2ODMgNy42MDIxNCAxMC40MjIyIDcuMTA1OTZDMTAuMDcyNyA2Ljc5NDA3IDkuNjYwMjYgNi41NjA5NSA5LjIxMjc5IDYuNDIyNDFDOC43NjUzMiA2LjI4Mzg4IDguMjkzMjkgNi4yNDMxNiA3LjgyODcxIDYuMzAzMDFDNy4zMDY0NyA2LjI5MTc5IDYuNzkwMzQgNi40MTY5OCA2LjMzMTI5IDYuNjY2MjJDNS44NzIyMyA2LjkxNTQ2IDUuNDg2MTMgNy4yODAxNCA1LjIxMTExIDcuNzI0MjNWNy43MjQyM1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik01NS40MjczIDQuNDgwMkM1NS44MzAzIDMuOTc3NjggNTYuMzQwNSAzLjU3MTY2IDU2LjkyMDcgMy4yOTE4NEM1Ny43ODk3IDIuOTQ4MzEgNTguNzE2MyAyLjc3Mzg5IDU5LjY1MDcgMi43Nzc5NkM2MC41NzU4IDIuNzUwMTUgNjEuNDkzNiAyLjk0ODYgNjIuMzI0NiAzLjM1NjA4QzYzLjkzMDQgNC4xNTkwMiA2NC4zMDc4IDUuNTQwMDggNjQuMzA3OCA3Ljg3NjY1VjE4LjE1NDNINTkuOTE1N1Y5LjcxNTM5QzU5Ljk5MTMgOC45NjAwMyA1OS45MjMyIDguMTk3MTggNTkuNzE1IDcuNDY3MTVDNTkuNTQwMSA3LjA5Njk4IDU5LjI1NjcgNi43ODg4NCA1OC45MDI0IDYuNTgzNzJDNTguNTQ4MSA2LjM3ODYxIDU4LjEzOTggNi4yODYyNSA1Ny43MzE3IDYuMzE4OTRDNTUuNDAzMiA2LjMxODk0IDU1LjQwMzIgOC4xODk4IDU1LjQwMzIgMTAuMDYwN1YxOC4xNTQzSDUwLjk2MjlWMy4xNjMzN0g1NS40MjczVjQuNDgwMloiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik00OC44NTkxIDE0LjI3NjNDNDguNDQ5NiAxNS4xMzU0IDQ3LjE0ODggMTguNTMxOSA0MS4zNzU2IDE4LjUzMTlDMzYuOTExMyAxOC41MzE5IDMzLjc3OTggMTUuODAxOSAzMy43Nzk4IDEwLjg3OThDMzMuNzc5OCA3LjI1MDUxIDM1LjU2MjMgMi43ODYxNCA0MS40OTYxIDIuNzg2MTRDNDIuNDg1OSAyLjcwNTMzIDQzLjQ4MTUgMi44Mzg0NyA0NC40MTUzIDMuMTc2NTJDNDUuMzQ5MSAzLjUxNDU3IDQ2LjE5OTIgNC4wNDk2MiA0Ni45MDc5IDQuNzQ1MzJDNDguODY3MSA2Ljg0OTAzIDQ4Ljk3OTUgOS43Nzk3OCA0OS4wMzU3IDExLjQ4MkgzOC4zMDA0QzM4LjMwMDQgMTMuMzUyOSAzOS4zMzYyIDE1LjIyMzcgNDEuNzIwOSAxNS4yMjM3QzQ0LjEwNTYgMTUuMjIzNyA0NC45MzI3IDEzLjYxNzkgNDUuNTE4OCAxMi41NzRMNDguODU5MSAxNC4yNzYzWk00NC40NTg5IDguNzE5ODlDNDQuNDMwMiA3Ljk0MjExIDQ0LjE0ODMgNy4xOTQ5OCA0My42NTYgNi41OTIwOUM0My4wNjQ3IDYuMDU4OTQgNDIuMjkyMSA1Ljc3MTczIDQxLjQ5NjEgNS43ODkxNUM0MS4wNzM5IDUuNzg3NTQgNDAuNjU2IDUuODczOCA0MC4yNjg5IDYuMDQyNDRDMzkuODgxOSA2LjIxMTA5IDM5LjUzNDEgNi40NTg0MyAzOS4yNDc4IDYuNzY4NzRDMzguNzcgNy4zMzI3NSAzOC40NjEgOC4wMjAyIDM4LjM1NjYgOC43NTIwMUw0NC40NTg5IDguNzE5ODlaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTEwLjQ3NyA2LjI3MDk5SDExMy40MjRWMy4xNjM2SDExMC41MTdWLTMuMDYyOTllLTA3SDEwNi4xMTdWMy4xNTU1N0gxMDUuMzk0TDEwMy4zNzkgNi4yNzA5OUgxMDYuMDkzVjEzLjQwOTJDMTA2LjA5MyAxNC44NDY0IDEwNi4wOTMgMTUuOTE0NCAxMDYuNzI3IDE2LjgwNTZDMTA3LjY3NSAxOC4xODY3IDEwOS4zNDUgMTguMjc1IDExMC44NyAxOC4yNzVDMTExLjY1MiAxOC4yNjE4IDExMi40MyAxOC4xODM5IDExMy4xOTkgMTguMDQyMlYxNC41ODk1TDExMS41OTMgMTQuNjQ1N0MxMTAuNDEzIDE0LjY0NTcgMTEwLjQxMyAxMy44NDI4IDExMC40NDUgMTIuOTUxNUwxMTAuNDc3IDYuMjcwOTlaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNjYuNTIzNyAtMy4wNjI5OWUtMDdINzAuOTIzOFYzLjE1NTU3SDc1LjUwMDZMNzMuNDg1MiA2LjI3MDk5SDcwLjg2NzZWMTIuOTI3NEM3MC44Njc2IDEzLjg1MDggNzAuODY3NiAxNC42MjE2IDcyLjAxNTggMTQuNjIxNkw3My42MjE3IDE0LjU2NTRWMTguMDE4MUM3Mi44NTMzIDE4LjE1OTggNzIuMDc0NCAxOC4yMzc3IDcxLjI5MzEgMTguMjUwOUM2OS43Njc1IDE4LjI1MDkgNjguMDgxNCAxOC4xNjI2IDY3LjE1IDE2Ljc4MTVDNjYuNTQ3NyAxNS44OTAzIDY2LjUxNTYgMTQuODIyMyA2Ni41MTU2IDEzLjM4NTFMNjYuNTIzNyAtMy4wNjI5OWUtMDdaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTE3LjQ5NSA2LjI3MDk3SDExNi45NDlWMy42MjEyNUgxMTUuOTQ1VjMuMTYzNTdIMTE4LjQ3NVYzLjYyMTI1SDExNy40ODdMMTE3LjQ5NSA2LjI3MDk3Wk0xMjEuNzU5IDYuMjcwOTdIMTIxLjIyMVY0LjM1MTkzVjMuNzE3NjFMMTIxLjA2OCA0LjIzOTUyTDEyMC40MzQgNi4yNzA5N0gxMTkuOTQ0TDExOS4zMTggNC4yMzk1MkwxMTkuMTU3IDMuNzI1NjRWNC4zNTE5M1Y2LjI3MDk3SDExOC42MzVWMy4xNjM1N0gxMTkuMzc0TDEyMC4xNzcgNS42MjA1OEwxMjAuOTQgMy4xNjM1N0gxMjEuNjc4TDEyMS43NTkgNi4yNzA5N1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik04OS4zMzU2IDE0LjI4NDNMODguNTMyNyAxNS41ODVDODcuNzI5OCAxNi43NDEzIDg2LjI2MDQgMTguNTIzOCA4Mi4wMDQ4IDE4LjUyMzhDNzcuNTQwNCAxOC41MjM4IDc0LjU0NTQgMTUuNzkzOCA3NC41NDU0IDEwLjg3MThDNzQuNTQ1NCA3LjI0MjQ1IDc2LjMyNzkgMi43NzgwOCA4Mi4yNjE3IDIuNzc4MDhDODMuMjUxNSAyLjY5NzI3IDg0LjI0NzEgMi44MzA0MSA4NS4xODA5IDMuMTY4NDZDODYuMTE0NyAzLjUwNjUyIDg2Ljk2NDggNC4wNDE1NiA4Ny42NzM1IDQuNzM3MjZDODkuNjMyNyA2Ljg0MDk4IDg5Ljc0NTEgOS43NzE3MiA4OS44MDE0IDExLjQ3NEg3OS4wNjZDNzkuMDY2IDEzLjM0NDggNzkuOTY1MyAxNS4yMTU3IDgyLjM1IDE1LjIxNTdDODQuNzM0OCAxNS4yMTU3IDg1LjQ2NTUgMTMuNjA5OCA4Ni4wMTE1IDEyLjU2Nkw4OS4zMzU2IDE0LjI4NDNaTTg1LjE4NDQgOC43MTk4N0M4NS4xNTU3IDcuOTQyMDggODQuODczNyA3LjE5NDk1IDg0LjM4MTUgNi41OTIwN0M4My43OTAyIDYuMDU4OTEgODMuMDE3NiA1Ljc3MTcgODIuMjIxNiA1Ljc4OTEyQzgxLjc5OTQgNS43ODc1MSA4MS4zODE0IDUuODczNzcgODAuOTk0NCA2LjA0MjQyQzgwLjYwNzMgNi4yMTEwNiA4MC4yNTk2IDYuNDU4NCA3OS45NzMzIDYuNzY4NzFDNzkuNDk1NCA3LjMzMjcyIDc5LjE4NjUgOC4wMjAxNyA3OS4wODIgOC43NTE5OEw4NS4xODQ0IDguNzE5ODdaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTA0LjQ2MyAxOC4xNTQ1TDk4Ljk1NDcgMTAuMjYxNkwxMDMuNTQ4IDMuMTU1NTJIOTguNTA1TDk2LjMzNzEgNi41MTE4Mkw5NC4wMDA1IDMuMTU1NTJIODguOTU4TDkzLjkxMjIgMTAuMjYxNkw4OC44MTM1IDE4LjE1NDVIOTMuODU2TDk2LjUyOTggMTQuMDExM0w5OS40MjA0IDE4LjE1NDVIMTA0LjQ2M1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yMi4yMzM3IDQuNDgwNDlDMjIuNzE1MiAzLjkxMjY2IDIzLjMyMTggMy40NjQxNiAyNC4wMDU5IDMuMTcwMjFDMjQuNjg5OSAyLjg3NjI1IDI1LjQzMjggMi43NDQ4NCAyNi4xNzYxIDIuNzg2MjhDMjkuODYxNyAyLjc4NjI4IDMyLjQ0NzEgNS41ODA1MiAzMi40NDcxIDEwLjU4MjlDMzIuNDQ3MSAxMy42NTgxIDMxLjMyMyAxOC41MjQgMjYuMDIzNiAxOC41MjRDMjUuMzA2OSAxOC41NDA4IDI0LjU5NTQgMTguMzk3NCAyMy45NDEyIDE4LjEwNDNDMjMuMjg2OSAxNy44MTEyIDIyLjcwNjMgMTcuMzc1OCAyMi4yNDE3IDE2LjgyOThWMjMuMTE2OEgxNy43NzczVjMuMTYzNjZIMjIuMjQxN0wyMi4yMzM3IDQuNDgwNDlaTTI1LjIyODcgNi4yMzg5NEMyNC43ODg2IDYuMjM3MDcgMjQuMzU0MiA2LjMzNzY3IDIzLjk1OTggNi41MzI3OEMyMy41NjU0IDYuNzI3OSAyMy4yMjE4IDcuMDEyMTYgMjIuOTU2MyA3LjM2MzA2QzIyLjI5MjIgOC4zMjc3NCAyMS45NjczIDkuNDg1NzYgMjIuMDMyOSAxMC42NTUxQzIxLjk1MDEgMTEuODk4NCAyMi4zMzA1IDEzLjEyODQgMjMuMTAwOSAxNC4xMDc4QzIzLjM1MTEgMTQuMzkyOSAyMy42NTgzIDE0LjYyMjMgMjQuMDAyNyAxNC43ODE0QzI0LjM0NyAxNC45NDA0IDI0LjcyMDkgMTUuMDI1NSAyNS4xMDAyIDE1LjAzMTJDMjcuMjYwMSAxNS4wMzEyIDI4LjIwNzYgMTIuNzU4OCAyOC4yMDc2IDEwLjU1ODhDMjguMjA3NiA4LjcxMiAyNy42NjE2IDYuNzUyODIgMjUuODQ2OSA2LjMyNzI2QzI1LjY0NTMgNi4yNzMwOSAyNS40Mzc0IDYuMjQ2MDkgMjUuMjI4NyA2LjI0Njk3VjYuMjM4OTRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K`;
  };
  let LogoView = Marionette.View.extend({
    tagName: "otc-brand",
    attributes: function() {},
    template: false,
    constructor: function LogoView(options = {}) {
      Marionette.View.apply(this, arguments);
      this.brandingConfigData = this.options.context.getModel(BrandingConfigFactory);
      var connector = this.options?.context?._user?.connector;
      this.logoUrl = "/";
      if (connector) {
        let serverUrl = new Url(connector?.connection?.url ?? location.href);
        this.logoUrl = NodeLinks.getHomeUrl(serverUrl);
      }
      this.otcData = {
        logosrc: getDefaultLogo(),
        logourl: this.logoUrl,
        tooltipbrand: "",
        primarytext: "",
        secondarytext: "",
        versiontext: ""
      };
      this.updateData();
      this.listenTo(this.brandingConfigData, "change:branding", this.updateData);
      this.listenTo(this.options.context.brandingConfigData, "change:brand", this.updateData);
      this.listenTo(this.options.context, "sync:perspective", this.updateData);
      this.performClickAction = false;
    },
    onShow: function() {
      this.options?.otcEl?.addEventListener("click", _.bind(this._onClick, this));
    },
    _onClick: function(event) {
      this.applicationScope.set("id", "");
    },
    updateData: function() {
      let fromCtx = this.options?.context?.previewBranding?.get("brandingSettingCodes");
      let fromData = this?.options?.context?.brandingConfigData?.get("brandingSettingCodes");
      let backgroundColor = fromCtx?.customBrandingBgColor ?? fromData?.customBrandingBgColor ?? "";
      let primaryText = fromCtx?.primaryText ?? fromData?.primaryText ?? "";
      let secondaryText = fromCtx?.secondaryText ?? fromData?.secondaryText ?? "";
      let versionText = fromCtx?.versionText ?? fromData?.versionText ?? "";
      let logoSrc, theme;
      if (this?.options?.parentView?._parent?.options?.el?.tagName?.toLowerCase() === "body") {
        theme = theming.getTheme();
      } else {
        theme = this?.options?.parentView?._parent?.options?.el?.attr("branding-theme");
      }
      let brandSettingsPreviewThemes = this?.options?.context?.previewBranding?.get("brandingSettingCodes")?.themes, brandingConfigDataThemes = this?.options?.context?.brandingConfigData?.get("brandingSettingCodes")?.themes;
      if (isJato() && theme && CommonConfigUtil.enableJatoBranding()) {
        logoSrc = brandSettingsPreviewThemes ? brandSettingsPreviewThemes[theme]?.brandLogoUri : brandSettingsPreviewThemes ?? brandingConfigDataThemes ? brandingConfigDataThemes[theme]?.brandLogoUri : brandingConfigDataThemes;
      } else {
        logoSrc = this?.options?.context?.previewBranding?.get("brandLogoUri") ?? this?.options?.context?.brandingConfigData?.get("brandLogoUri");
      }
      logoSrc = logoSrc?.length ? logoSrc : getDefaultLogo();
      this.applicationScope = this.options?.applicationScope ?? this.options.context.getModel(ApplicationScopeModelFactory);
      let logoUrl = !!this?.applicationScope?.id?.length ? this.logoUrl : "";
      let tooltipbrand = !!this?.applicationScope?.id?.length ? lang.LandingPageBackTo : "";
      this.otcData = {
        logosrc: logoSrc,
        logourl: logoUrl,
        tooltipbrand: tooltipbrand,
        primarytext: primaryText,
        secondarytext: secondaryText,
        versiontext: versionText,
        backgroundColor: backgroundColor
      };
      this.trigger("data:synced");
    }
  });
  return LogoView;
});