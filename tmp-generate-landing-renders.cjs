const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const publicDir = "c:/Cursor Projects/Exchange marketplace webapp/replace-finder/public";

const html = String.raw`
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Landing Render Studio</title>
    <style>
      :root {
        --bg: #f4f2ee;
        --panel: rgba(255, 255, 255, 0.96);
        --panel-soft: rgba(255, 255, 255, 0.88);
        --border: #e3dccf;
        --muted: #6f6a60;
        --text: #1d1d1d;
        --charcoal: #1d1d1d;
        --teal: #39484d;
        --gold: #fadc6a;
        --warm: #f0ebe3;
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Plus Jakarta Sans", Arial, sans-serif;
        background: linear-gradient(180deg, #fbf9f4 0%, #f4f2ee 100%);
        color: var(--text);
      }

      .stage {
        min-height: 100vh;
        display: grid;
        gap: 48px;
        place-items: center;
        padding: 40px;
      }

      .render-card {
        position: relative;
        overflow: hidden;
        border-radius: 32px;
        background: #ffffff;
        box-shadow:
          0 40px 80px rgba(69, 58, 39, 0.08),
          0 12px 24px rgba(69, 58, 39, 0.04);
      }

      .dashboard-render {
        width: 1680px;
        height: 1180px;
        display: grid;
        grid-template-columns: 280px 1fr;
      }

      .sidebar {
        background: #ffffff;
        border-right: 1px solid #f0ebe1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .sidebar-top { padding: 28px 20px 18px; }
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        padding-bottom: 20px;
        border-bottom: 1px solid #f0ebe1;
      }
      .brand-mark {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: linear-gradient(135deg, #1d1d1d 0%, #39484d 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fadc6a;
        box-shadow: 0 4px 10px rgba(29,29,29,0.12);
      }
      .brand-mark svg { width: 22px; height: 22px; }
      .brand-title {
        font-size: 18px;
        font-weight: 800;
        letter-spacing: -0.03em;
        flex: 1;
      }
      .pill {
        border-radius: 999px;
        padding: 5px 10px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.01em;
      }
      .pill.agent { background: rgba(250, 220, 106, 0.45); color: #5a471b; }
      .pill.live {
        background: #e8f7ee;
        color: #2a8d56;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .pill.live::before {
        content: "";
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: #2a8d56;
        box-shadow: 0 0 0 3px rgba(42,141,86,0.18);
      }
      .pill.teal { background: rgba(57,72,77,0.1); color: var(--teal); }
      .section-label {
        margin: 22px 0 8px;
        padding: 0 12px;
        color: #9c958a;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 11px 14px;
        border-radius: 12px;
        color: #6a655b;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 2px;
      }
      .nav-item svg {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        stroke: currentColor;
        stroke-width: 2;
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
        opacity: 0.75;
      }
      .nav-item.active {
        background: #1d1d1d;
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(29,29,29,0.15);
      }
      .nav-item.active svg { opacity: 1; }
      .nav-badge {
        margin-left: auto;
        background: #fadc6a;
        color: #5a471b;
        font-size: 10px;
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 999px;
      }
      .nav-item.active .nav-badge {
        background: #fadc6a;
        color: #5a471b;
      }

      .sidebar-footer {
        border-top: 1px solid #f0ebe1;
        padding: 18px 20px 22px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .sidebar-avatar {
        width: 44px;
        height: 44px;
        border-radius: 999px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        font-weight: 700;
        color: #ffffff;
        background: linear-gradient(135deg, #39484d 0%, #1d1d1d 100%);
        box-shadow: 0 3px 8px rgba(29,29,29,0.14);
      }
      .sidebar-info { min-width: 0; flex: 1; }
      .sidebar-name {
        font-size: 14px;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: #1d1d1d;
      }
      .sidebar-meta {
        color: #847d70;
        font-size: 12px;
        margin-top: 2px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .sidebar-meta svg {
        width: 12px;
        height: 12px;
        stroke: #2a8d56;
        stroke-width: 2.5;
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .dashboard-main {
        background: #ffffff;
        display: flex;
        flex-direction: column;
      }
      .dashboard-header {
        height: 72px;
        border-bottom: 1px solid #f0ebe1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 32px;
        background: #ffffff;
      }
      .header-search {
        width: 440px;
        height: 42px;
        border-radius: 12px;
        background: #faf7f1;
        border: 1px solid #f0ebe1;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 16px;
      }
      .header-search svg {
        width: 18px;
        height: 18px;
        stroke: #9c958a;
        stroke-width: 2;
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .header-search span {
        color: #9c958a;
        font-size: 14px;
        font-weight: 500;
      }
      .header-search kbd {
        margin-left: auto;
        background: #ffffff;
        border: 1px solid #e4dcd0;
        border-radius: 6px;
        padding: 2px 8px;
        font-size: 11px;
        font-family: inherit;
        font-weight: 700;
        color: #7a7468;
      }
      .header-actions {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .header-icon-btn {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: #faf7f1;
        border: 1px solid #f0ebe1;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      .header-icon-btn svg {
        width: 18px;
        height: 18px;
        stroke: #4a4438;
        stroke-width: 2;
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .header-icon-btn .badge-dot {
        position: absolute;
        top: 9px;
        right: 9px;
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #ef4444;
        border: 2px solid #faf7f1;
      }
      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 999px;
        background: linear-gradient(135deg, #39484d 0%, #1d1d1d 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 14px;
        font-weight: 700;
        box-shadow: 0 3px 8px rgba(29,29,29,0.15);
      }

      .dashboard-content {
        padding: 36px 36px 36px;
        display: grid;
        gap: 22px;
      }
      .headline {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
      }
      .headline h1 {
        margin: 0;
        font-size: 44px;
        letter-spacing: -0.04em;
        line-height: 1.05;
        color: #1d1d1d;
      }
      .headline .subtitle {
        margin: 10px 0 0;
        color: #7a7468;
        font-size: 15px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .headline .subtitle svg {
        width: 14px;
        height: 14px;
        stroke: #2a8d56;
        stroke-width: 2.5;
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .headline .date-badge {
        padding: 10px 16px;
        border-radius: 12px;
        background: #faf7f1;
        border: 1px solid #f0ebe1;
        color: #4a4438;
        font-size: 13px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .headline .date-badge svg {
        width: 14px;
        height: 14px;
        stroke: currentColor;
        stroke-width: 2;
        fill: none;
      }

      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
      }
      .kpi {
        padding: 22px;
        border-radius: 20px;
        border: 1px solid #f0ebe1;
        background: #ffffff;
        box-shadow: 0 2px 4px rgba(69,58,39,0.02);
        position: relative;
        overflow: hidden;
      }
      .kpi-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
      }
      .kpi-label {
        color: #7c766b;
        font-size: 13px;
        font-weight: 600;
      }
      .kpi-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .kpi-icon svg {
        width: 20px;
        height: 20px;
        stroke-width: 2;
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .kpi-icon.teal { background: rgba(57,72,77,0.1); }
      .kpi-icon.teal svg { stroke: #39484d; }
      .kpi-icon.gold { background: rgba(250,220,106,0.32); }
      .kpi-icon.gold svg { stroke: #7a5a0a; }
      .kpi-icon.green { background: #e8f7ee; }
      .kpi-icon.green svg { stroke: #2a8d56; }
      .kpi-icon.charcoal { background: rgba(29,29,29,0.08); }
      .kpi-icon.charcoal svg { stroke: #1d1d1d; }
      .kpi-value {
        display: block;
        margin-top: 18px;
        font-size: 40px;
        font-weight: 800;
        letter-spacing: -0.04em;
        color: #1d1d1d;
        line-height: 1;
      }
      .kpi-trend {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        margin-top: 10px;
        font-size: 12px;
        font-weight: 700;
        color: #2a8d56;
      }
      .kpi-trend svg {
        width: 12px;
        height: 12px;
        stroke: currentColor;
        stroke-width: 2.5;
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .kpi-trend.neutral { color: #847d70; }
      .kpi-trend.warm { color: #c4780c; }

      .dashboard-bottom {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 18px;
      }
      .panel {
        border-radius: 20px;
        border: 1px solid #f0ebe1;
        background: #ffffff;
        box-shadow: 0 2px 4px rgba(69,58,39,0.02);
        padding: 24px;
      }
      .panel-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
      }
      .panel-head h2 {
        margin: 0;
        font-size: 22px;
        letter-spacing: -0.03em;
        color: #1d1d1d;
      }
      .panel-head p {
        margin: 6px 0 0;
        color: #7c766b;
        font-size: 14px;
      }

      .deadline-list {
        margin-top: 20px;
        display: grid;
        gap: 10px;
      }
      .deadline-item {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 14px;
        padding: 14px 16px;
        border-radius: 14px;
        border: 1px solid;
      }
      .deadline-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .deadline-icon svg {
        width: 18px;
        height: 18px;
        stroke-width: 2;
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .deadline-item.urgent { background: #fff5f4; border-color: #f4d5d1; }
      .deadline-item.urgent .deadline-icon { background: #ffe4e0; }
      .deadline-item.urgent .deadline-icon svg { stroke: #c43a2f; }
      .deadline-item.urgent .deadline-count { color: #c43a2f; }
      .deadline-item.soon { background: #fffaec; border-color: #eedaa0; }
      .deadline-item.soon .deadline-icon { background: #fff2cf; }
      .deadline-item.soon .deadline-icon svg { stroke: #b67a0f; }
      .deadline-item.soon .deadline-count { color: #b67a0f; }
      .deadline-item.healthy { background: #f1faf4; border-color: #cceedb; }
      .deadline-item.healthy .deadline-icon { background: #dcf3e4; }
      .deadline-item.healthy .deadline-icon svg { stroke: #2a8d56; }
      .deadline-item.healthy .deadline-count { color: #2a8d56; }
      .deadline-item strong {
        display: block;
        font-size: 16px;
        color: #1d1d1d;
        letter-spacing: -0.02em;
      }
      .deadline-item .deadline-sub {
        font-size: 13px;
        font-weight: 600;
        color: #847d70;
        margin-top: 2px;
      }
      .deadline-count {
        font-size: 20px;
        font-weight: 800;
        letter-spacing: -0.03em;
      }

      .chart-card {
        margin-top: 20px;
        border-radius: 16px;
        background: linear-gradient(180deg, #faf7f1 0%, #ffffff 100%);
        border: 1px solid #f0ebe1;
        padding: 22px 20px 20px;
      }
      .chart-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .chart-top .chart-value {
        font-size: 30px;
        font-weight: 800;
        letter-spacing: -0.04em;
        color: #1d1d1d;
        line-height: 1;
      }
      .chart-top .chart-label {
        color: #7a7468;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 8px;
      }
      .chart-top .chart-trend {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 6px 10px;
        background: #e8f7ee;
        color: #2a8d56;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
      }
      .chart-top .chart-trend svg {
        width: 12px;
        height: 12px;
        stroke: currentColor;
        stroke-width: 2.5;
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .bars {
        margin-top: 28px;
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 14px;
        height: 170px;
        padding-bottom: 28px;
        border-bottom: 1px dashed #e4dcd0;
        position: relative;
      }
      .bar-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        height: 100%;
      }
      .bar {
        width: 70%;
        max-width: 38px;
        border-radius: 10px 10px 4px 4px;
        background: linear-gradient(180deg, #39484d 0%, #5c7076 100%);
        box-shadow: 0 2px 6px rgba(57,72,77,0.18);
      }
      .bar.highlight {
        background: linear-gradient(180deg, #fadc6a 0%, #e9c534 100%);
        box-shadow: 0 3px 10px rgba(233,197,52,0.35);
      }
      .bar-label {
        position: absolute;
        bottom: -22px;
        font-size: 12px;
        color: #7c766b;
        font-weight: 700;
      }
      .bar-tooltip {
        position: absolute;
        top: -26px;
        background: #1d1d1d;
        color: #fff;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
      }
      .bar-tooltip::after {
        content: "";
        position: absolute;
        bottom: -3px;
        left: 50%;
        transform: translateX(-50%) rotate(45deg);
        width: 6px;
        height: 6px;
        background: #1d1d1d;
      }
      .chart-footer {
        margin-top: 38px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .chart-stat {
        padding: 12px 14px;
        border-radius: 12px;
        background: rgba(57,72,77,0.05);
      }
      .chart-stat p {
        margin: 0;
        color: #7c766b;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .chart-stat strong {
        display: block;
        margin-top: 4px;
        font-size: 20px;
        font-weight: 800;
        letter-spacing: -0.03em;
        color: #1d1d1d;
      }

      .hero-card {
        border-radius: 40px;
        background: #ffffff;
        display: flex;
        flex-direction: column;
      }
      .hero-list-card {
        width: 1180px;
        height: 820px;
        padding: 44px 40px 36px;
      }
      .hero-head {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
      }
      .hero-head .title {
        font-size: 30px;
        font-weight: 700;
        letter-spacing: -0.04em;
        margin: 0;
        line-height: 1.1;
      }
      .hero-head .subtitle {
        margin-top: 6px;
        color: #7a7468;
        font-size: 16px;
        font-weight: 600;
      }
      .hero-head .head-right {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .head-pill {
        padding: 8px 14px;
        border-radius: 999px;
        background: #f4f0e7;
        color: #4e4838;
        font-size: 13px;
        font-weight: 700;
      }
      .stats-strip {
        margin-top: 26px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
      }
      .stat-box {
        padding: 18px 20px;
        border-radius: 20px;
        background: #faf6ee;
      }
      .stat-box.accent {
        background: linear-gradient(135deg, #fff4a7 0%, #ffeb88 100%);
      }
      .stat-box p {
        margin: 0;
        color: #7a7468;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .stat-box.accent p { color: #7a621a; }
      .stat-box strong {
        display: block;
        margin-top: 8px;
        font-size: 30px;
        letter-spacing: -0.04em;
        line-height: 1;
      }
      .stat-box.accent strong { color: #4a3d13; }
      .match-list {
        margin-top: 22px;
        display: grid;
        gap: 14px;
        flex: 1;
      }
      .match-row {
        display: grid;
        grid-template-columns: auto auto minmax(0,1fr) auto;
        gap: 20px;
        align-items: center;
        padding: 18px 22px;
        border-radius: 24px;
        background: #faf7f1;
      }
      .match-row.featured {
        background: linear-gradient(135deg, #fff4a7 0%, #ffec8c 100%);
      }
      .score-badge {
        width: 60px;
        height: 60px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        font-weight: 800;
        color: #fff;
        flex-shrink: 0;
        box-shadow: 0 6px 14px rgba(0,0,0,0.10);
      }
      .score-badge.green { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
      .score-badge.amber { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
      .match-photo {
        width: 90px;
        height: 62px;
        border-radius: 16px;
        flex-shrink: 0;
        background-size: cover;
        background-position: center;
        background-color: #e6e0d3;
        box-shadow: 0 3px 10px rgba(0,0,0,0.08);
      }
      .match-row:nth-child(1) .match-photo { background-image: url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&h=350&fit=crop&auto=format&q=85'); }
      .match-row:nth-child(2) .match-photo { background-image: url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&h=350&fit=crop&auto=format&q=85'); }
      .match-row:nth-child(3) .match-photo { background-image: url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&h=350&fit=crop&auto=format&q=85'); }
      .match-row:nth-child(4) .match-photo { background-image: url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&h=350&fit=crop&auto=format&q=85'); }
      .match-info strong {
        display: block;
        font-size: 20px;
        letter-spacing: -0.03em;
        line-height: 1.15;
      }
      .match-details {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 7px;
        color: #6f6a60;
        font-size: 15px;
        font-weight: 600;
      }
      .match-details .dot {
        width: 4px;
        height: 4px;
        border-radius: 999px;
        background: #c0b9ac;
        flex-shrink: 0;
      }
      .match-location {
        margin-top: 4px;
        color: #8a8477;
        font-size: 14px;
        font-weight: 600;
      }
      .match-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
        flex-shrink: 0;
      }
      .status-pill {
        padding: 7px 14px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 700;
        white-space: nowrap;
      }
      .status-pill.no-boot { background: #e8f7ee; color: #2a8d56; }
      .status-pill.minor-boot { background: #fff1dc; color: #b67a0f; }
      .asset-tag {
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        background: rgba(57,72,77,0.09);
        color: var(--teal);
      }
      .hero-footer {
        margin-top: 22px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 22px;
        border-top: 1px solid #efe6d8;
        font-size: 17px;
        font-weight: 700;
        color: var(--text);
      }
      .hero-footer .right {
        color: #7a7468;
        font-weight: 600;
      }

      .hero-kpi-card {
        width: 760px;
        height: 640px;
        padding: 36px 36px 30px;
      }
      .breakdown-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
      }
      .breakdown-header .prop-name {
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.04em;
        line-height: 1.1;
      }
      .breakdown-header .prop-loc {
        margin-top: 6px;
        color: #8a8477;
        font-size: 15px;
        font-weight: 600;
      }
      .overall-score {
        width: 78px;
        height: 78px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 30px;
        font-weight: 800;
        color: #fff;
        flex-shrink: 0;
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        box-shadow: 0 8px 22px rgba(22,163,74,0.3);
      }
      .breakdown-tags {
        margin-top: 18px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .breakdown-tag {
        padding: 7px 14px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        background: rgba(57,72,77,0.09);
        color: var(--teal);
      }
      .breakdown-tag.success {
        background: #e8f7ee;
        color: #2a8d56;
      }
      .breakdown-divider {
        height: 1px;
        background: #efe6d8;
        margin: 22px 0 18px;
      }
      .breakdown-label {
        color: #8a8477;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 14px;
      }
      .score-bars {
        display: grid;
        gap: 12px;
        flex: 1;
      }
      .score-bar-row {
        display: grid;
        grid-template-columns: 110px 1fr 40px;
        gap: 14px;
        align-items: center;
      }
      .score-bar-row .dim-label {
        font-size: 14px;
        font-weight: 700;
        color: var(--text);
      }
      .bar-track {
        height: 12px;
        border-radius: 999px;
        background: #f0ebe3;
        overflow: hidden;
      }
      .bar-fill {
        height: 100%;
        border-radius: 999px;
      }
      .bar-fill.green { background: linear-gradient(90deg, #22c55e 0%, #4ade80 100%); }
      .bar-fill.amber { background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%); }
      .bar-fill.teal { background: linear-gradient(90deg, #39484d 0%, #5a7a84 100%); }
      .score-bar-row .dim-value {
        font-size: 15px;
        font-weight: 800;
        text-align: right;
        letter-spacing: -0.02em;
      }
      .breakdown-footer {
        margin-top: 22px;
        border-top: 1px solid #efe6d8;
        padding-top: 18px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      .metric-box {
        border-radius: 18px;
        background: #faf6ee;
        padding: 16px 18px;
      }
      .metric-box p {
        margin: 0;
        color: #7a7468;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .metric-box strong {
        display: block;
        margin-top: 8px;
        font-size: 28px;
        letter-spacing: -0.04em;
      }
    </style>
  </head>
  <body>
    <div class="stage">
      <section id="dashboard-render" class="render-card dashboard-render">
        <aside class="sidebar">
          <div class="sidebar-top">
            <div class="brand">
              <div class="brand-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 20L12 4L20 20"/>
                  <path d="M8 14H16"/>
                </svg>
              </div>
              <div class="brand-title">1031ExchangeUp</div>
              <span class="pill agent">Agent</span>
            </div>

            <div class="section-label">Exchange Network</div>
            <div class="nav-item">
              <svg viewBox="0 0 24 24"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
              Launchpad
            </div>
            <div class="nav-item active">
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
              Dashboard
            </div>
            <div class="nav-item">
              <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              My Clients
              <span class="nav-badge">14</span>
            </div>
            <div class="nav-item">
              <svg viewBox="0 0 24 24"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>
              Exchanges
              <span class="nav-badge">8</span>
            </div>
            <div class="nav-item">
              <svg viewBox="0 0 24 24"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>
              Matches
              <span class="nav-badge">21</span>
            </div>
            <div class="nav-item">
              <svg viewBox="0 0 24 24"><path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
              Connections
            </div>

            <div class="section-label">Tools</div>
            <div class="nav-item">
              <svg viewBox="0 0 24 24"><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>
              Identification Lists
            </div>
            <div class="nav-item">
              <svg viewBox="0 0 24 24"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
              Messages
              <span class="nav-badge" style="background:#ef4444;color:#fff;">3</span>
            </div>

            <div class="section-label">Account</div>
            <div class="nav-item">
              <svg viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              Settings
            </div>
            <div class="nav-item">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
              Help
            </div>
          </div>

          <div class="sidebar-footer">
            <div class="sidebar-avatar">AB</div>
            <div class="sidebar-info">
              <div class="sidebar-name">Aria Bennett</div>
              <div class="sidebar-meta">
                <svg viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
                Verified agent
              </div>
            </div>
          </div>
        </aside>

        <div class="dashboard-main">
          <div class="dashboard-header">
            <div class="header-search">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <span>Search exchanges, clients, matches...</span>
              <kbd>&#8984; K</kbd>
            </div>
            <div class="header-actions">
              <span class="pill live">Live network</span>
              <div class="header-icon-btn">
                <svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                <div class="badge-dot"></div>
              </div>
              <div class="avatar">AB</div>
            </div>
          </div>

          <div class="dashboard-content">
            <div class="headline">
              <div>
                <h1>Welcome back, Aria</h1>
                <div class="subtitle">
                  <svg viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
                  Summit Exchange Partners · Verified agent
                </div>
              </div>
              <div class="date-badge">
                <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                Thursday, April 16
              </div>
            </div>

            <div class="kpi-grid">
              <div class="kpi">
                <div class="kpi-top">
                  <span class="kpi-label">Active Clients</span>
                  <div class="kpi-icon teal">
                    <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                </div>
                <span class="kpi-value">14</span>
                <div class="kpi-trend">
                  <svg viewBox="0 0 24 24"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
                  +2 this month
                </div>
              </div>
              <div class="kpi">
                <div class="kpi-top">
                  <span class="kpi-label">Active Exchanges</span>
                  <div class="kpi-icon charcoal">
                    <svg viewBox="0 0 24 24"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>
                  </div>
                </div>
                <span class="kpi-value">8</span>
                <div class="kpi-trend">
                  <svg viewBox="0 0 24 24"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
                  +1 this week
                </div>
              </div>
              <div class="kpi">
                <div class="kpi-top">
                  <span class="kpi-label">Total Matches</span>
                  <div class="kpi-icon gold">
                    <svg viewBox="0 0 24 24"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>
                  </div>
                </div>
                <span class="kpi-value">21</span>
                <div class="kpi-trend">
                  <svg viewBox="0 0 24 24"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
                  +5 this week
                </div>
              </div>
              <div class="kpi">
                <div class="kpi-top">
                  <span class="kpi-label">Pending Connections</span>
                  <div class="kpi-icon green">
                    <svg viewBox="0 0 24 24"><path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
                  </div>
                </div>
                <span class="kpi-value">4</span>
                <div class="kpi-trend warm">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  Awaiting response
                </div>
              </div>
            </div>

            <div class="dashboard-bottom">
              <div class="panel">
                <div class="panel-head">
                  <div>
                    <h2>Upcoming deadlines</h2>
                    <p>Prioritize the exchanges that need attention first.</p>
                  </div>
                  <span class="pill teal">6 tracked</span>
                </div>
                <div class="deadline-list">
                  <div class="deadline-item urgent">
                    <div class="deadline-icon">
                      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    </div>
                    <div>
                      <strong>Willow Creek Apartments</strong>
                      <div class="deadline-sub">Identification deadline</div>
                    </div>
                    <div class="deadline-count">5d</div>
                  </div>
                  <div class="deadline-item soon">
                    <div class="deadline-icon">
                      <svg viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                    </div>
                    <div>
                      <strong>Harbor Retail Center</strong>
                      <div class="deadline-sub">Closing deadline</div>
                    </div>
                    <div class="deadline-count">11d</div>
                  </div>
                  <div class="deadline-item soon">
                    <div class="deadline-icon">
                      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    </div>
                    <div>
                      <strong>Mesa Industrial Park</strong>
                      <div class="deadline-sub">Identification deadline</div>
                    </div>
                    <div class="deadline-count">16d</div>
                  </div>
                  <div class="deadline-item healthy">
                    <div class="deadline-icon">
                      <svg viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                    </div>
                    <div>
                      <strong>Pine Ridge Storage</strong>
                      <div class="deadline-sub">Closing deadline</div>
                    </div>
                    <div class="deadline-count">23d</div>
                  </div>
                </div>
              </div>

              <div class="panel">
                <div class="panel-head">
                  <div>
                    <h2>Weekly activity</h2>
                    <p>Match momentum and client outreach.</p>
                  </div>
                  <span class="pill teal">+18%</span>
                </div>

                <div class="chart-card">
                  <div class="chart-top">
                    <div>
                      <div class="chart-label">Matches reviewed</div>
                      <div class="chart-value">11</div>
                    </div>
                    <div class="chart-trend">
                      <svg viewBox="0 0 24 24"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
                      +3 vs last wk
                    </div>
                  </div>
                  <div class="bars">
                    <div class="bar-col"><div class="bar" style="height:40%"></div><div class="bar-label">M</div></div>
                    <div class="bar-col"><div class="bar" style="height:58%"></div><div class="bar-label">T</div></div>
                    <div class="bar-col"><div class="bar" style="height:48%"></div><div class="bar-label">W</div></div>
                    <div class="bar-col">
                      <div class="bar-tooltip">11</div>
                      <div class="bar highlight" style="height:90%"></div>
                      <div class="bar-label">T</div>
                    </div>
                    <div class="bar-col"><div class="bar" style="height:66%"></div><div class="bar-label">F</div></div>
                    <div class="bar-col"><div class="bar" style="height:34%"></div><div class="bar-label">S</div></div>
                    <div class="bar-col"><div class="bar" style="height:28%"></div><div class="bar-label">S</div></div>
                  </div>
                  <div class="chart-footer">
                    <div class="chart-stat">
                      <p>New matches</p>
                      <strong>5</strong>
                    </div>
                    <div class="chart-stat">
                      <p>Connections opened</p>
                      <strong>3</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="hero-list-render" class="hero-card hero-list-card">
        <div class="hero-head">
          <div>
            <h3 class="title">Property matches</h3>
            <div class="subtitle">Willow Creek Apartments exchange · sorted by score</div>
          </div>
          <div class="head-right">
            <span class="head-pill">Sort by Score</span>
          </div>
        </div>

        <div class="stats-strip">
          <div class="stat-box accent">
            <p>Strong matches</p>
            <strong>5</strong>
          </div>
          <div class="stat-box">
            <p>Total matches</p>
            <strong>21</strong>
          </div>
          <div class="stat-box">
            <p>No-boot eligible</p>
            <strong>12</strong>
          </div>
        </div>

        <div class="match-list">
          <div class="match-row featured">
            <div class="score-badge green">92</div>
            <div class="match-photo"></div>
            <div class="match-info">
              <strong>Summit Ridge Office Park</strong>
              <div class="match-details">
                <span>$4,200,000</span>
                <span class="dot"></span>
                <span>6.8% cap</span>
                <span class="dot"></span>
                <span>42,000 SF</span>
              </div>
              <div class="match-location">Scottsdale, AZ</div>
            </div>
            <div class="match-meta">
              <span class="status-pill no-boot">No Boot</span>
              <span class="asset-tag">Office</span>
            </div>
          </div>
          <div class="match-row">
            <div class="score-badge green">88</div>
            <div class="match-photo"></div>
            <div class="match-info">
              <strong>Parkview Retail Center</strong>
              <div class="match-details">
                <span>$3,750,000</span>
                <span class="dot"></span>
                <span>7.2% cap</span>
                <span class="dot"></span>
                <span>28,500 SF</span>
              </div>
              <div class="match-location">Chandler, AZ</div>
            </div>
            <div class="match-meta">
              <span class="status-pill no-boot">No Boot</span>
              <span class="asset-tag">Retail</span>
            </div>
          </div>
          <div class="match-row">
            <div class="score-badge amber">74</div>
            <div class="match-photo"></div>
            <div class="match-info">
              <strong>Lakeshore Industrial</strong>
              <div class="match-details">
                <span>$5,100,000</span>
                <span class="dot"></span>
                <span>5.9% cap</span>
                <span class="dot"></span>
                <span>64,200 SF</span>
              </div>
              <div class="match-location">Mesa, AZ</div>
            </div>
            <div class="match-meta">
              <span class="status-pill minor-boot">Minor Boot</span>
              <span class="asset-tag">Industrial</span>
            </div>
          </div>
          <div class="match-row">
            <div class="score-badge amber">71</div>
            <div class="match-photo"></div>
            <div class="match-info">
              <strong>Canyon Vista Apartments</strong>
              <div class="match-details">
                <span>$6,800,000</span>
                <span class="dot"></span>
                <span>5.4% cap</span>
                <span class="dot"></span>
                <span>48 units</span>
              </div>
              <div class="match-location">Tempe, AZ</div>
            </div>
            <div class="match-meta">
              <span class="status-pill minor-boot">Minor Boot</span>
              <span class="asset-tag">Multifamily</span>
            </div>
          </div>
        </div>

        <div class="hero-footer">
          <span>See all matches</span>
          <span class="right">21 matches found · updated just now</span>
        </div>
      </section>

      <section id="hero-kpi-render" class="hero-card hero-kpi-card">
        <div class="breakdown-header">
          <div>
            <div class="prop-name">Summit Ridge Office Park</div>
            <div class="prop-loc">Scottsdale, AZ</div>
          </div>
          <div class="overall-score">92</div>
        </div>

        <div class="breakdown-tags">
          <span class="breakdown-tag">Office</span>
          <span class="breakdown-tag">Stabilized</span>
          <span class="breakdown-tag success">No Boot</span>
        </div>

        <div class="breakdown-divider"></div>
        <div class="breakdown-label">Match score breakdown</div>

        <div class="score-bars">
          <div class="score-bar-row">
            <span class="dim-label">Price</span>
            <div class="bar-track"><div class="bar-fill green" style="width:94%"></div></div>
            <span class="dim-value">94</span>
          </div>
          <div class="score-bar-row">
            <span class="dim-label">Geography</span>
            <div class="bar-track"><div class="bar-fill green" style="width:95%"></div></div>
            <span class="dim-value">95</span>
          </div>
          <div class="score-bar-row">
            <span class="dim-label">Asset Type</span>
            <div class="bar-track"><div class="bar-fill teal" style="width:100%"></div></div>
            <span class="dim-value">100</span>
          </div>
          <div class="score-bar-row">
            <span class="dim-label">Strategy</span>
            <div class="bar-track"><div class="bar-fill green" style="width:88%"></div></div>
            <span class="dim-value">88</span>
          </div>
          <div class="score-bar-row">
            <span class="dim-label">Financial</span>
            <div class="bar-track"><div class="bar-fill green" style="width:90%"></div></div>
            <span class="dim-value">90</span>
          </div>
          <div class="score-bar-row">
            <span class="dim-label">Timing</span>
            <div class="bar-track"><div class="bar-fill green" style="width:85%"></div></div>
            <span class="dim-value">85</span>
          </div>
          <div class="score-bar-row">
            <span class="dim-label">Debt Fit</span>
            <div class="bar-track"><div class="bar-fill green" style="width:92%"></div></div>
            <span class="dim-value">92</span>
          </div>
          <div class="score-bar-row">
            <span class="dim-label">Scale Fit</span>
            <div class="bar-track"><div class="bar-fill amber" style="width:78%"></div></div>
            <span class="dim-value">78</span>
          </div>
        </div>

        <div class="breakdown-footer">
          <div class="metric-box">
            <p>Asking price</p>
            <strong>$4.2M</strong>
          </div>
          <div class="metric-box">
            <p>Cap rate</p>
            <strong>6.8%</strong>
          </div>
        </div>
      </section>
    </div>
  </body>
</html>
`;

async function capture() {
  const browser = await chromium.launch();

  const dashPage = await browser.newPage({
    viewport: { width: 1800, height: 1400, deviceScaleFactor: 2 },
  });
  await dashPage.setContent(html, { waitUntil: "load" });
  await dashPage.locator("#dashboard-render").screenshot({
    path: path.join(publicDir, "landing-dashboard-render.png"),
    omitBackground: false,
  });
  await dashPage.close();

  const heroPage = await browser.newPage({
    viewport: { width: 5200, height: 4200, deviceScaleFactor: 2 },
  });
  await heroPage.setContent(html, { waitUntil: "networkidle" });
  await heroPage.evaluate(() => {
    document.body.style.background = "transparent";
    document.documentElement.style.background = "transparent";
  });
  await heroPage.evaluate(async () => {
    const imgs = Array.from(document.images);
    await Promise.all(
      imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            }),
      ),
    );
  });

  const heroShots = [
    ["#hero-list-render", "landing-hero-list-render.png"],
    ["#hero-kpi-render", "landing-hero-kpi-render.png"],
  ];

  for (const [selector, fileName] of heroShots) {
    await heroPage.evaluate((sel) => {
      document.querySelector(sel).style.zoom = "4";
    }, selector);
    await heroPage.locator(selector).screenshot({
      path: path.join(publicDir, fileName),
      omitBackground: true,
    });
    await heroPage.evaluate((sel) => {
      document.querySelector(sel).style.zoom = "";
    }, selector);
  }

  await heroPage.close();
  await browser.close();
}

fs.mkdirSync(publicDir, { recursive: true });
capture().catch((error) => {
  console.error(error);
  process.exit(1);
});
