# ネットワークインスペクター スキル

taiyou-mcp-bundleのネットワーク監視ツール（12個）を活用するスキルです。

## 使用方法

```
/mcp-network
```

---

## 利用可能なMCPツール

| ツール名 | 機能 |
|---------|------|
| `mcp__taiyou-mcp__network_interfaces` | ネットワークインターフェース一覧 |
| `mcp__taiyou-mcp__network_connections` | アクティブな接続一覧 |
| `mcp__taiyou-mcp__network_ports` | 使用中のポート一覧 |
| `mcp__taiyou-mcp__network_stats` | ネットワーク統計情報 |
| `mcp__taiyou-mcp__network_dns` | DNSルックアップ |
| `mcp__taiyou-mcp__network_ping` | Ping実行 |
| `mcp__taiyou-mcp__network_public_ip` | 公開IPアドレス取得 |
| `mcp__taiyou-mcp__network_wifi` | WiFi情報取得 |
| `mcp__taiyou-mcp__network_route` | ルーティングテーブル |
| `mcp__taiyou-mcp__network_arp` | ARPテーブル |
| `mcp__taiyou-mcp__network_bandwidth` | 帯域幅測定 |
| `mcp__taiyou-mcp__network_port_check` | 特定ポートの確認 |

---

## ユースケース

### 1. ネットワーク接続状態の確認

```
「ネットワークの状態を確認して」

使用ツール:
- mcp__taiyou-mcp__network_interfaces
- mcp__taiyou-mcp__network_connections
- mcp__taiyou-mcp__network_public_ip

出力例:
【ネットワーク状態】
■ インターフェース:
  - en0 (WiFi): 192.168.1.100
  - lo0 (Loopback): 127.0.0.1

■ 公開IP: 203.0.113.50
■ アクティブ接続数: 45
```

### 2. ポート使用状況の確認

```
「使用中のポートを一覧表示して」

使用ツール:
- mcp__taiyou-mcp__network_ports

出力例:
【使用中ポート】
■ 22 (SSH): sshd - LISTEN
■ 80 (HTTP): nginx - LISTEN
■ 443 (HTTPS): nginx - LISTEN
■ 3000 (Node): node - LISTEN
■ 5432 (PostgreSQL): postgres - LISTEN
```

### 3. 特定ポートの確認

```
「ポート8080が使用可能か確認して」

使用ツール:
- mcp__taiyou-mcp__network_port_check

パラメータ:
- port: 8080

出力例:
【ポート8080】
■ 状態: 未使用（利用可能）

または

【ポート8080】
■ 状態: 使用中
■ プロセス: java (PID: 12345)
■ 説明: Tomcat Server
```

### 4. DNS解決の確認

```
「example.comのDNSを確認して」

使用ツール:
- mcp__taiyou-mcp__network_dns

パラメータ:
- domain: "example.com"

出力例:
【DNS解決: example.com】
■ Aレコード: 93.184.216.34
■ AAAAレコード: 2606:2800:220:1:248:1893:25c8:1946
■ MXレコード: mail.example.com
■ TTL: 3600
```

### 5. 接続性テスト

```
「google.comへの接続を確認して」

使用ツール:
- mcp__taiyou-mcp__network_ping

パラメータ:
- host: "google.com"

出力例:
【Ping: google.com】
■ 結果: 成功
■ 応答時間: 12ms (平均)
■ パケットロス: 0%
```

### 6. WiFi情報の確認

```
「WiFiの接続情報を見せて」

使用ツール:
- mcp__taiyou-mcp__network_wifi

出力例:
【WiFi情報】
■ SSID: MyNetwork
■ 信号強度: -45 dBm (良好)
■ チャンネル: 6
■ セキュリティ: WPA2
■ 速度: 866 Mbps
```

### 7. ルーティング情報

```
「ルーティングテーブルを見せて」

使用ツール:
- mcp__taiyou-mcp__network_route

出力例:
【ルーティングテーブル】
■ デフォルトゲートウェイ: 192.168.1.1
■ ローカルネットワーク: 192.168.1.0/24
■ インターフェース: en0
```

---

## 組み合わせ例

### ネットワーク総合診断

```
「ネットワークの総合診断を実行して」

実行順序:
1. network_interfaces - インターフェース確認
2. network_public_ip - 外部IP確認
3. network_wifi - WiFi状態
4. network_ping (google.com) - 接続性確認
5. network_dns (example.com) - DNS確認
6. network_ports - ポート状況

出力:
━━━━━━━━━━━━━━━━━━━━
【ネットワーク総合診断】
━━━━━━━━━━━━━━━━━━━━

■ 接続状態
  ✓ インターネット接続: 正常
  ✓ DNS解決: 正常
  ✓ 応答時間: 15ms

■ ネットワーク情報
  ローカルIP: 192.168.1.100
  公開IP: 203.0.113.50
  WiFi: MyNetwork (-42dBm)

■ 使用ポート: 12個
  主要: 22, 80, 443, 3000

■ 評価: 良好
━━━━━━━━━━━━━━━━━━━━
```

### サービス接続確認

```
「外部サービスへの接続を確認して」

実行順序:
1. network_ping (api.github.com)
2. network_ping (registry.npmjs.org)
3. network_dns (api.anthropic.com)

出力:
━━━━━━━━━━━━━━━━━━━━
【外部サービス接続確認】
━━━━━━━━━━━━━━━━━━━━

■ GitHub API
  ✓ 接続: 正常 (23ms)

■ npm Registry
  ✓ 接続: 正常 (45ms)

■ Anthropic API
  ✓ DNS解決: 正常
  ✓ 接続可能

■ 評価: 全サービス正常
━━━━━━━━━━━━━━━━━━━━
```

---

## 注意事項

```
- 一部の機能は管理者権限が必要な場合があります
- Pingはファイアウォールでブロックされる場合があります
- 帯域幅測定は一時的にネットワーク負荷がかかります
```
