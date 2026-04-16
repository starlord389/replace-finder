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
        border-radius: 30px;
        border: 1px solid var(--border);
        background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.92) 100%);
        box-shadow:
          0 30px 80px rgba(69, 58, 39, 0.12),
          0 10px 24px rgba(69, 58, 39, 0.06);
      }

      .dashboard-render {
        width: 1680px;
        height: 1180px;
        display: grid;
        grid-template-columns: 300px 1fr;
      }

      .sidebar {
        background: linear-gradient(180deg, #fcfbf8 0%, #f8f4ee 100%);
        border-right: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .sidebar-top { padding: 26px 22px 18px; }
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        padding-bottom: 18px;
        border-bottom: 1px solid var(--border);
      }
      .brand-title {
        font-size: 22px;
        font-weight: 700;
        letter-spacing: -0.04em;
      }
      .pill {
        border-radius: 999px;
        padding: 5px 10px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.01em;
      }
      .pill.agent { background: rgba(250, 220, 106, 0.32); }
      .pill.live { background: rgba(250, 220, 106, 0.24); color: #5d4d00; }
      .pill.teal { background: rgba(57,72,77,0.1); color: var(--teal); }
      .section-label {
        margin: 24px 0 12px;
        color: #8a8477;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        border-radius: 14px;
        color: #6a655b;
        font-size: 15px;
        font-weight: 600;
      }
      .nav-item.active {
        background: rgba(57,72,77,0.1);
        color: var(--teal);
      }
      .nav-dot {
        width: 18px;
        height: 18px;
        border-radius: 6px;
        background: rgba(57,72,77,0.14);
      }
      .nav-item.active .nav-dot { background: var(--teal); }

      .sidebar-footer {
        border-top: 1px solid var(--border);
        padding: 20px 22px 24px;
      }
      .sidebar-name {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.03em;
      }
      .sidebar-meta {
        color: #847d70;
        font-size: 14px;
        margin-top: 4px;
      }
      .verified {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 10px;
        padding: 6px 10px;
        border-radius: 999px;
        background: #e8f7ee;
        color: #2a8d56;
        font-size: 12px;
        font-weight: 700;
      }

      .dashboard-main {
        background: var(--bg);
        display: flex;
        flex-direction: column;
      }
      .dashboard-header {
        height: 74px;
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 28px;
        background: rgba(255,255,255,0.8);
        backdrop-filter: blur(12px);
      }
      .header-search {
        width: 420px;
        height: 18px;
        border-radius: 999px;
        background: linear-gradient(90deg, rgba(57,72,77,0.08) 0%, rgba(57,72,77,0.03) 100%);
      }
      .header-actions {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .avatar {
        width: 34px;
        height: 34px;
        border-radius: 999px;
        background: linear-gradient(135deg, #f7d98b 0%, #c7d5df 100%);
      }

      .dashboard-content {
        padding: 36px 34px 34px;
        display: grid;
        gap: 22px;
      }
      .headline h1 {
        margin: 0;
        font-size: 54px;
        letter-spacing: -0.05em;
        line-height: 1.02;
      }
      .headline p {
        margin: 10px 0 0;
        color: #7a7468;
        font-size: 18px;
        font-weight: 600;
      }

      .success-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 18px;
        border-radius: 18px;
        border: 1px solid #bfe7d1;
        background: linear-gradient(180deg, #edf9f1 0%, #e8f7ee 100%);
        color: #2a8d56;
        font-size: 17px;
        font-weight: 600;
      }

      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
      }
      .kpi {
        padding: 22px;
        border-radius: 22px;
        border: 1px solid var(--border);
        background: var(--panel);
        box-shadow: 0 10px 24px rgba(69,58,39,0.04);
      }
      .kpi-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: #7c766b;
        font-size: 14px;
        font-weight: 700;
      }
      .kpi-icon {
        width: 40px;
        height: 40px;
        border-radius: 14px;
        background: rgba(57,72,77,0.12);
      }
      .kpi strong {
        display: block;
        margin-top: 20px;
        font-size: 42px;
        letter-spacing: -0.05em;
      }

      .dashboard-bottom {
        display: grid;
        grid-template-columns: 1.15fr 0.85fr;
        gap: 18px;
      }
      .panel {
        border-radius: 24px;
        border: 1px solid var(--border);
        background: var(--panel);
        box-shadow: 0 10px 24px rgba(69,58,39,0.04);
        padding: 24px;
      }
      .panel-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
      }
      .panel-head h2 {
        margin: 0;
        font-size: 26px;
        letter-spacing: -0.04em;
      }
      .panel-head p {
        margin: 8px 0 0;
        color: #7c766b;
        font-size: 15px;
      }

      .deadline-list {
        margin-top: 22px;
        display: grid;
        gap: 12px;
      }
      .deadline-item {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: 16px;
        padding: 16px 18px;
        border-radius: 18px;
        border: 1px solid;
      }
      .deadline-item.urgent { background: #fff2f1; border-color: #f1d0cb; color: #bb4c45; }
      .deadline-item.soon { background: #fff8e8; border-color: #eedaa0; color: #b67a0f; }
      .deadline-item.healthy { background: #eef9f1; border-color: #c9e8d1; color: #2b8f58; }
      .deadline-item strong {
        display: block;
        font-size: 18px;
        color: var(--text);
        letter-spacing: -0.03em;
      }
      .deadline-item span {
        font-size: 14px;
        font-weight: 600;
      }

      .trend-card {
        margin-top: 20px;
        border-radius: 18px;
        background: linear-gradient(180deg, #fffaf2 0%, #fff 100%);
        border: 1px solid #efe4d1;
        padding: 20px 18px 18px;
      }
      .trend-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .trend-top strong {
        font-size: 36px;
        letter-spacing: -0.05em;
      }
      .bars {
        margin-top: 24px;
        display: flex;
        align-items: end;
        gap: 12px;
        height: 178px;
      }
      .bar-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }
      .bar-stack {
        width: 100%;
        display: flex;
        align-items: end;
        justify-content: center;
        gap: 0;
        height: 148px;
      }
      .bar-stack span {
        width: 22px;
        border-radius: 10px 10px 4px 4px;
        display: block;
      }
      .bar-stack .a { background: #ffd553; }
      .bar-stack .b { background: #ffb6b5; }
      .bar-stack .c { background: #7fd9ea; }
      .bar-label {
        font-size: 12px;
        color: #7c766b;
        font-weight: 700;
      }

      .hero-shell {
        position: relative;
        background: transparent;
      }
      .hero-list-render {
        width: 1180px;
        height: 820px;
      }
      .hero-list-card {
        position: absolute;
        inset: 24px 18px 18px 18px;
        border-radius: 36px;
        border: 1px solid rgba(255,255,255,0.72);
        background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.92) 100%);
        box-shadow: 0 35px 80px rgba(60,48,31,0.12);
        padding: 34px 32px 28px;
      }
      .hero-glow {
        position: absolute;
        inset: auto auto 40px 34px;
        width: 90px;
        height: 90px;
        border-radius: 999px;
        background: radial-gradient(circle, rgba(250,220,106,0.75) 0%, rgba(250,220,106,0) 70%);
      }
      .hero-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 22px;
        font-weight: 700;
        letter-spacing: -0.04em;
      }
      .hero-subhead {
        color: #6f6a60;
        font-weight: 700;
      }
      .client-list {
        margin-top: 28px;
        display: grid;
        gap: 20px;
      }
      .client-row {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 18px;
        align-items: center;
      }
      .client-row.featured {
        padding: 18px 20px;
        border-radius: 28px;
        background: linear-gradient(180deg, #fff4a7 0%, #fff09b 100%);
        box-shadow: inset 0 0 0 1px rgba(255, 236, 158, 0.75);
      }
      .client-avatar {
        width: 52px;
        height: 52px;
        border-radius: 999px;
        box-shadow: inset 0 0 0 3px rgba(255,255,255,0.72);
      }
      .client-row:nth-child(1) .client-avatar { background: linear-gradient(135deg, #fd8366 0%, #ffd05f 100%); }
      .client-row:nth-child(2) .client-avatar { background: linear-gradient(135deg, #8fdaf7 0%, #f7b2a7 100%); }
      .client-row:nth-child(3) .client-avatar { background: linear-gradient(135deg, #ff7b72 0%, #ffd46c 100%); }
      .client-row:nth-child(4) .client-avatar { background: linear-gradient(135deg, #ffc3d1 0%, #ff9e7c 100%); }
      .client-copy strong {
        display: block;
        font-size: 18px;
        letter-spacing: -0.03em;
      }
      .client-copy span {
        display: block;
        color: #6f6a60;
        font-size: 16px;
        font-weight: 600;
        margin-top: 4px;
      }
      .client-meta {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .status-pill {
        padding: 8px 12px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
      }
      .status-pill.match { background: rgba(57,72,77,0.1); color: var(--teal); }
      .status-pill.deadline { background: #fff2e3; color: #c4780c; }
      .mini-icons {
        display: flex;
        gap: 10px;
        color: rgba(29,29,29,0.55);
      }
      .mini-icons span {
        width: 18px;
        height: 18px;
        border-radius: 6px;
        border: 1.5px solid currentColor;
      }
      .hero-footer {
        margin-top: 34px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 18px;
        font-weight: 700;
      }

      .hero-kpi-render {
        width: 760px;
        height: 640px;
      }
      .hero-kpi-card {
        position: absolute;
        inset: 20px;
        border-radius: 34px;
        border: 1px solid rgba(255,255,255,0.68);
        background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.92) 100%);
        box-shadow: 0 28px 68px rgba(60,48,31,0.12);
        padding: 28px 30px 24px;
      }
      .kpi-card-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .kpi-card-top .label {
        color: #7a7468;
        font-size: 16px;
        font-weight: 600;
        line-height: 1.3;
      }
      .kpi-card-top .delta {
        color: #6a655b;
        font-size: 16px;
        font-weight: 700;
      }
      .kpi-card-top strong {
        display: block;
        margin-top: 8px;
        font-size: 48px;
        line-height: 1;
        letter-spacing: -0.05em;
      }
      .kpi-chart {
        margin-top: 28px;
        height: 250px;
        display: flex;
        align-items: end;
        gap: 12px;
      }
      .kpi-day {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }
      .kpi-stack {
        width: 38px;
        height: 210px;
        display: flex;
        align-items: end;
      }
      .kpi-stack-inner {
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: end;
        gap: 6px;
        height: 100%;
      }
      .kpi-stack-inner span {
        display: block;
        border-radius: 10px;
      }
      .kpi-stack-inner .yellow { background: #ffd553; }
      .kpi-stack-inner .rose { background: #ffb7b7; }
      .kpi-stack-inner .cyan { background: #7fd9ea; }
      .kpi-day small {
        color: #7a7468;
        font-size: 14px;
        font-weight: 700;
      }
      .kpi-footer {
        margin-top: 18px;
        border-top: 1px solid #efe6d8;
        padding-top: 18px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      .metric-box {
        border-radius: 18px;
        background: #fbf8f2;
        padding: 16px 18px;
      }
      .metric-box p {
        margin: 0;
        color: #7a7468;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .metric-box strong {
        display: block;
        margin-top: 10px;
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
              <div class="brand-title">1031ExchangeUp</div>
              <span class="pill agent">Agent</span>
            </div>

            <div class="section-label">Exchange Network</div>
            <div class="nav-item"><span class="nav-dot"></span>Launchpad</div>
            <div class="nav-item active"><span class="nav-dot"></span>Dashboard</div>
            <div class="nav-item"><span class="nav-dot"></span>My Clients</div>
            <div class="nav-item"><span class="nav-dot"></span>Exchanges</div>
            <div class="nav-item"><span class="nav-dot"></span>Matches</div>
            <div class="nav-item"><span class="nav-dot"></span>Connections</div>

            <div class="section-label">Tools</div>
            <div class="nav-item"><span class="nav-dot"></span>Identification Lists</div>
            <div class="nav-item"><span class="nav-dot"></span>Messages</div>

            <div class="section-label">Account</div>
            <div class="nav-item"><span class="nav-dot"></span>Settings</div>
            <div class="nav-item"><span class="nav-dot"></span>Help</div>
          </div>

          <div class="sidebar-footer">
            <div class="sidebar-name">Aria Bennett</div>
            <div class="sidebar-meta">Summit Exchange Partners</div>
            <div class="verified">Verified agent</div>
          </div>
        </aside>

        <div class="dashboard-main">
          <div class="dashboard-header">
            <div class="header-search"></div>
            <div class="header-actions">
              <span class="pill teal">11 new matches</span>
              <div class="avatar"></div>
            </div>
          </div>

          <div class="dashboard-content">
            <div class="headline">
              <h1>Welcome back, Aria</h1>
              <p>Summit Exchange Partners · Verified agent</p>
            </div>

            <div class="success-banner">
              <span>Your workspace is active and your exchange pipeline is progressing on schedule.</span>
              <span class="pill live">Live network</span>
            </div>

            <div class="kpi-grid">
              <div class="kpi">
                <div class="kpi-top"><span>Active Clients</span><span class="kpi-icon"></span></div>
                <strong>14</strong>
              </div>
              <div class="kpi">
                <div class="kpi-top"><span>Active Exchanges</span><span class="kpi-icon"></span></div>
                <strong>8</strong>
              </div>
              <div class="kpi">
                <div class="kpi-top"><span>Total Matches</span><span class="kpi-icon"></span></div>
                <strong>21</strong>
              </div>
              <div class="kpi">
                <div class="kpi-top"><span>Pending Connections</span><span class="kpi-icon"></span></div>
                <strong>4</strong>
              </div>
            </div>

            <div class="dashboard-bottom">
              <div class="panel">
                <div class="panel-head">
                  <div>
                    <h2>Upcoming deadlines</h2>
                    <p>Prioritize the exchanges that need attention first.</p>
                  </div>
                  <span class="pill live">6 tracked</span>
                </div>
                <div class="deadline-list">
                  <div class="deadline-item urgent">
                    <div><strong>Willow Creek Apartments</strong><span>identification deadline</span></div>
                    <strong>5d</strong>
                  </div>
                  <div class="deadline-item soon">
                    <div><strong>Harbor Retail Center</strong><span>closing deadline</span></div>
                    <strong>11d</strong>
                  </div>
                  <div class="deadline-item soon">
                    <div><strong>Mesa Industrial Park</strong><span>identification deadline</span></div>
                    <strong>16d</strong>
                  </div>
                  <div class="deadline-item healthy">
                    <div><strong>Pine Ridge Storage</strong><span>closing deadline</span></div>
                    <strong>23d</strong>
                  </div>
                </div>
              </div>

              <div class="panel">
                <div class="panel-head">
                  <div>
                    <h2>Weekly activity</h2>
                    <p>Real match momentum and client outreach.</p>
                  </div>
                  <span class="pill teal">+18%</span>
                </div>

                <div class="trend-card">
                  <div class="trend-top">
                    <div>
                      <div style="color:#7a7468;font-size:14px;font-weight:700;">Matches reviewed</div>
                      <strong>11</strong>
                    </div>
                    <div style="color:#7a7468;font-size:14px;font-weight:700;">This week</div>
                  </div>
                  <div class="bars">
                    <div class="bar-col"><div class="bar-stack"><span class="a" style="height:36px"></span><span class="b" style="height:28px"></span><span class="c" style="height:40px"></span></div><div class="bar-label">M</div></div>
                    <div class="bar-col"><div class="bar-stack"><span class="a" style="height:46px"></span><span class="b" style="height:32px"></span><span class="c" style="height:58px"></span></div><div class="bar-label">T</div></div>
                    <div class="bar-col"><div class="bar-stack"><span class="a" style="height:42px"></span><span class="b" style="height:26px"></span><span class="c" style="height:48px"></span></div><div class="bar-label">W</div></div>
                    <div class="bar-col"><div class="bar-stack"><span class="a" style="height:64px"></span><span class="b" style="height:42px"></span><span class="c" style="height:72px"></span></div><div class="bar-label">T</div></div>
                    <div class="bar-col"><div class="bar-stack"><span class="a" style="height:50px"></span><span class="b" style="height:30px"></span><span class="c" style="height:52px"></span></div><div class="bar-label">F</div></div>
                    <div class="bar-col"><div class="bar-stack"><span class="a" style="height:38px"></span><span class="b" style="height:22px"></span><span class="c" style="height:40px"></span></div><div class="bar-label">S</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="hero-list-render" class="hero-shell hero-list-render">
        <div class="hero-glow"></div>
        <div class="hero-list-card">
          <div class="hero-head">
            <span>Client pipeline</span>
            <span class="hero-subhead">Sorted by urgency</span>
          </div>
          <div class="client-list">
            <div class="client-row featured">
              <div class="client-avatar"></div>
              <div class="client-copy">
                <strong>Willow Creek Apartments</strong>
                <span>Buyer mandate · 5-day identification window</span>
              </div>
              <div class="client-meta">
                <span class="status-pill deadline">Urgent</span>
                <div class="mini-icons"><span></span><span></span><span></span></div>
              </div>
            </div>
            <div class="client-row">
              <div class="client-avatar"></div>
              <div class="client-copy">
                <strong>Harbor Retail Center</strong>
                <span>3 candidate properties matched</span>
              </div>
              <div class="client-meta">
                <span class="status-pill match">Match-ready</span>
              </div>
            </div>
            <div class="client-row">
              <div class="client-avatar"></div>
              <div class="client-copy">
                <strong>Mesa Industrial Park</strong>
                <span>Boot exposure under review</span>
              </div>
              <div class="client-meta">
                <span class="status-pill deadline">16d left</span>
              </div>
            </div>
            <div class="client-row">
              <div class="client-avatar"></div>
              <div class="client-copy">
                <strong>Pine Ridge Storage</strong>
                <span>Connection accepted · closing in progress</span>
              </div>
              <div class="client-meta">
                <span class="status-pill match">Live</span>
              </div>
            </div>
          </div>
          <div class="hero-footer">
            <span>All active clients</span>
            <span style="color:#7a7468;">14 tracked</span>
          </div>
        </div>
      </section>

      <section id="hero-kpi-render" class="hero-shell hero-kpi-render">
        <div class="hero-kpi-card">
          <div class="kpi-card-top">
            <div>
              <div class="label">Match activity</div>
              <strong>2h 20m</strong>
            </div>
            <div class="delta">+30m this week</div>
          </div>

          <div class="kpi-chart">
            <div class="kpi-day"><div class="kpi-stack"><div class="kpi-stack-inner"><span class="cyan" style="height:42px"></span><span class="rose" style="height:28px"></span><span class="yellow" style="height:32px"></span></div></div><small>M</small></div>
            <div class="kpi-day"><div class="kpi-stack"><div class="kpi-stack-inner"><span class="cyan" style="height:68px"></span><span class="rose" style="height:36px"></span><span class="yellow" style="height:42px"></span></div></div><small>T</small></div>
            <div class="kpi-day"><div class="kpi-stack"><div class="kpi-stack-inner"><span class="cyan" style="height:56px"></span><span class="rose" style="height:30px"></span><span class="yellow" style="height:36px"></span></div></div><small>W</small></div>
            <div class="kpi-day"><div class="kpi-stack"><div class="kpi-stack-inner"><span class="cyan" style="height:82px"></span><span class="rose" style="height:34px"></span><span class="yellow" style="height:40px"></span></div></div><small>T</small></div>
            <div class="kpi-day"><div class="kpi-stack"><div class="kpi-stack-inner"><span class="cyan" style="height:48px"></span><span class="rose" style="height:24px"></span><span class="yellow" style="height:36px"></span></div></div><small>F</small></div>
            <div class="kpi-day"><div class="kpi-stack"><div class="kpi-stack-inner"><span class="cyan" style="height:38px"></span><span class="rose" style="height:22px"></span><span class="yellow" style="height:28px"></span></div></div><small>S</small></div>
            <div class="kpi-day"><div class="kpi-stack"><div class="kpi-stack-inner"><span class="cyan" style="height:34px"></span><span class="rose" style="height:18px"></span><span class="yellow" style="height:24px"></span></div></div><small>S</small></div>
          </div>

          <div class="kpi-footer">
            <div class="metric-box">
              <p>New matches</p>
              <strong>11</strong>
            </div>
            <div class="metric-box">
              <p>Connections opened</p>
              <strong>4</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  </body>
</html>
`;

async function capture() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1800, height: 1400, deviceScaleFactor: 2 },
  });

  await page.setContent(html, { waitUntil: "load" });

  const shots = [
    ["#dashboard-render", "landing-dashboard-render.png"],
    ["#hero-list-render", "landing-hero-list-render.png"],
    ["#hero-kpi-render", "landing-hero-kpi-render.png"],
  ];

  for (const [selector, fileName] of shots) {
    const locator = page.locator(selector);
    await locator.screenshot({
      path: path.join(publicDir, fileName),
      omitBackground: false,
    });
  }

  await browser.close();
}

fs.mkdirSync(publicDir, { recursive: true });
capture().catch((error) => {
  console.error(error);
  process.exit(1);
});
