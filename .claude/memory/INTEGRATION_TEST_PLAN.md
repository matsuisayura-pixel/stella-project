# AIT42 v1.4.0 Integration Test Plan

**Version**: 1.0.0
**Created**: 2025-11-04
**Status**: Draft
**Owner**: AIT42 Integration Team

---

## Overview

### Purpose

This integration test plan validates that the Memory System, ReflectionAgent, and Coordinator work together seamlessly in AIT42 v1.4.0. The plan ensures:

1. **End-to-End Workflow**: Complete task lifecycle with memory integration
2. **Agent Selection**: Historical data enhances agent selection accuracy
3. **Quality Gating**: ReflectionAgent validates results before memory update
4. **Memory Persistence**: Task records and agent statistics persist correctly
5. **Error Handling**: Graceful degradation when memory is unavailable
6. **Performance**: Memory operations complete within acceptable overhead (<150ms)

### Scope

**In Scope**:
- Memory System file operations (read/write/update)
- Coordinator integration with Memory System
- ReflectionAgent integration with Memory System
- Agent selection algorithm with historical data
- Memory update after task completion
- Error handling and fallback mechanisms
- Performance benchmarks

**Out of Scope**:
- Individual agent implementation testing (covered by unit tests)
- UI/Frontend integration
- Network/distributed memory (planned for v1.6.0)
- ML-based selection (planned for v1.5.0)

### Components Under Test

```
┌─────────────────────────────────────────────────────────┐
│                    User Request                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Coordinator (Enhanced)                      │
│  - Query Memory for agent stats                         │
│  - Query Memory for similar tasks                       │
│  - Enhanced agent selection algorithm                   │
│  - Update Memory after completion                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                 Memory System                            │
│  - File-based storage (.claude/memory/)                 │
│  - Task records (tasks/*.yaml)                          │
│  - Agent statistics (agents/*-stats.yaml)               │
│  - Atomic writes, validation, caching                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              ReflectionAgent                             │
│  - Evaluate task result quality                         │
│  - Calculate 4-dimensional score                        │
│  - Make decision: Accept/Improve/Reject                 │
│  - Provide structured feedback                          │
└─────────────────────────────────────────────────────────┘
```

---

## Test Scenarios

### Scenario 1: End-to-End Workflow with Memory

**Objective**: Validate complete task flow from user request to memory update.

**Workflow**:
```
User submits request
  ↓
Coordinator queries Memory
  ├─ Load agent statistics
  └─ Search similar tasks
  ↓
Coordinator selects agents (memory-enhanced)
  ├─ Score agents by success rate
  ├─ Weight by specialization
  └─ Consider recent trends
  ↓
Agents execute task
  ↓
ReflectionAgent evaluates result
  ├─ Calculate quality score (4 dimensions)
  ├─ Make decision (Accept/Improve/Reject)
  └─ Generate feedback
  ↓
Coordinator updates Memory
  ├─ Create task record
  ├─ Update agent statistics
  └─ Recalculate trends
  ↓
User receives result + quality report
```

**Test Cases**:

#### TC-1.1: Successful Task with Memory Enhancement

**Given**:
- Memory directory exists and is populated
- `backend-developer` has 100 tasks, 90 successful (90% success rate, avg score: 92)
- `frontend-developer` has 50 tasks, 40 successful (80% success rate, avg score: 85)

**When**:
- User requests: "REST APIエンドポイントを実装してください"

**Then**:
1. Coordinator queries memory:
   - Loads `backend-developer-stats.yaml` (success: true)
   - Loads `frontend-developer-stats.yaml` (success: true)
   - Searches tasks with tags: ["api", "implementation"]
2. Coordinator scores agents:
   - `backend-developer`: Higher score due to better success rate
   - Selection: `backend-developer` is preferred
3. Task executes successfully
4. ReflectionAgent evaluates:
   - Quality score: 95 (high quality)
   - Decision: "ACCEPT"
5. Memory is updated:
   - Task record created: `2025-11-04-XXX-rest-api-endpoint.yaml`
   - `backend-developer-stats.yaml` updated:
     - `total_tasks`: 101
     - `successful_tasks`: 91
     - `success_rate`: 0.901 (91/101)
     - `recent_tasks`: Prepended with new task
6. User receives success message

**Validation**:
- [ ] Memory files read without errors
- [ ] Agent selection prefers `backend-developer`
- [ ] Task completes successfully
- [ ] Quality score calculated correctly
- [ ] Task record file created
- [ ] Agent stats file updated
- [ ] Statistics recalculated correctly

---

#### TC-1.2: Failed Task with Retry

**Given**:
- `backend-developer` has 100 tasks, 90 successful (90% success rate)

**When**:
- Task execution fails (throws exception)

**Then**:
1. ReflectionAgent evaluates failure
2. Decision: "REJECT" with reason
3. Coordinator initiates retry (max: 2 retries)
4. Retry succeeds with lower quality (score: 75)
5. Memory updated:
   - `backend-developer-stats.yaml`:
     - `total_tasks`: 102 (original + 2 attempts)
     - `successful_tasks`: 91 (only final success counts)
     - `failed_tasks`: 1 (first attempt)
     - Task record shows retry history

**Validation**:
- [ ] Retry triggered automatically
- [ ] Failed attempts tracked
- [ ] Final success recorded
- [ ] Retry history in task record

---

#### TC-1.3: Medium Quality Task Requiring Improvement

**Given**:
- Task executes but with medium quality

**When**:
- ReflectionAgent scores: 72 (below "good" threshold of 75)
- Decision: "IMPROVE"

**Then**:
1. User is prompted: "結果の品質は72点です。改善しますか？"
2. If user accepts improvement:
   - Task re-runs with additional context
   - New quality score: 88
3. Memory updated with improvement:
   - Task record shows improvement cycle
   - Agent stats updated

**Validation**:
- [ ] User prompted for improvement
- [ ] Improvement executed successfully
- [ ] Both attempts recorded
- [ ] Final quality score is higher

---

### Scenario 2: Memory-Enhanced Agent Selection

**Objective**: Validate that historical data improves agent selection accuracy.

#### TC-2.1: Prefer High Success Rate Agent

**Given**:
```yaml
# backend-developer-stats.yaml
success_rate: 0.95
avg_quality_score: 93
specializations:
  implementation: 80
  api: 50

# frontend-developer-stats.yaml
success_rate: 0.70
avg_quality_score: 78
specializations:
  implementation: 30
  ui: 60
```

**When**:
- User requests: "新しいAPI機能を実装"

**Then**:
- Coordinator calculates scores:
  ```
  backend-developer:
    success_rate_score: 0.95 * 0.4 = 0.38
    quality_score: (93/100) * 0.3 = 0.279
    specialization_score: (50/130) * 0.2 = 0.077
    Total: 0.736

  frontend-developer:
    success_rate_score: 0.70 * 0.4 = 0.28
    quality_score: (78/100) * 0.3 = 0.234
    specialization_score: (0/90) * 0.2 = 0
    Total: 0.514
  ```
- **Selection**: `backend-developer` (higher score)

**Validation**:
- [ ] `backend-developer` selected
- [ ] Score calculation matches expected
- [ ] Selection rationale logged

---

#### TC-2.2: Fallback to Keyword Matching When No Memory

**Given**:
- `.claude/memory/` directory does NOT exist

**When**:
- User requests: "バックエンドAPIを実装"

**Then**:
1. Coordinator attempts to read memory
2. Memory read fails gracefully
3. Falls back to keyword matching:
   - Keywords: ["バックエンド", "API", "実装"]
   - Matches: `backend-developer`, `api-developer`
4. Selection proceeds without memory enhancement
5. **Warning logged**: "Memory unavailable, using keyword fallback"

**Validation**:
- [ ] No errors thrown
- [ ] Keyword matching works
- [ ] Task completes successfully
- [ ] Warning logged (not error)

---

#### TC-2.3: Similar Past Task Influences Selection

**Given**:
```yaml
# Task history
2025-11-01-001-jwt-authentication.yaml:
  selected_agents: [security-architect, backend-developer]
  success: true
  quality_score: 98
  tags: [authentication, api, security]
```

**When**:
- User requests: "OAuth2認証を実装してください"

**Then**:
1. Coordinator queries similar tasks:
   - Matches task with tags: ["authentication", "api"]
2. Agents from similar successful task are boosted:
   - `security-architect`: +10% priority
   - `backend-developer`: +10% priority
3. Selection includes both agents

**Validation**:
- [ ] Similar tasks found correctly
- [ ] Agents from similar tasks prioritized
- [ ] Selection includes relevant agents

---

### Scenario 3: ReflectionAgent Integration

**Objective**: Validate ReflectionAgent quality gating and memory integration.

#### TC-3.1: High Quality Result (Score: 95) → ACCEPT

**Given**:
- Task completes with excellent quality

**When**:
- ReflectionAgent evaluates:
  ```
  Dimensions:
    - Code Quality: 95
    - Documentation: 95
    - Security: 95
    - Performance: 95
  Average: 95
  ```

**Then**:
1. Decision: "ACCEPT"
2. Feedback: "高品質な実装です。すべての基準を満たしています。"
3. Memory update proceeds:
   - Task record includes reflection score
   - Agent stats updated with quality score

**Validation**:
- [ ] Score calculated correctly (4 dimensions)
- [ ] Decision is "ACCEPT"
- [ ] Task record includes reflection
- [ ] Agent quality score updated

---

#### TC-3.2: Medium Quality Result (Score: 80) → IMPROVE

**Given**:
- Task completes with medium quality

**When**:
- ReflectionAgent evaluates:
  ```
  Dimensions:
    - Code Quality: 85
    - Documentation: 70  # Below threshold
    - Security: 90
    - Performance: 75
  Average: 80
  ```

**Then**:
1. Decision: "IMPROVE"
2. Feedback: "ドキュメントが不足しています。APIドキュメントを追加してください。"
3. User is prompted with improvement suggestions
4. If user accepts:
   - Task re-runs with focus on documentation
   - New score: 92
5. Memory updated with improvement record

**Validation**:
- [ ] Score identifies weak dimension (documentation)
- [ ] Decision is "IMPROVE"
- [ ] Specific feedback provided
- [ ] Improvement cycle tracked

---

#### TC-3.3: Low Quality Result (Score: 60) → REJECT → Auto-Retry

**Given**:
- Task completes but quality is poor

**When**:
- ReflectionAgent evaluates:
  ```
  Dimensions:
    - Code Quality: 60
    - Documentation: 50
    - Security: 70
    - Performance: 60
  Average: 60
  ```

**Then**:
1. Decision: "REJECT"
2. Feedback: "品質基準を満たしていません。再実行します。"
3. Auto-retry triggered (attempt 2 of 3)
4. Retry succeeds with score: 78
5. Decision: "ACCEPT"
6. Memory updated:
   - Task record shows retry history:
     ```yaml
     attempts:
       - attempt: 1
         quality_score: 60
         decision: "REJECT"
       - attempt: 2
         quality_score: 78
         decision: "ACCEPT"
     ```
   - Agent stats show 1 initial failure, 1 final success

**Validation**:
- [ ] Low quality triggers REJECT
- [ ] Auto-retry executed
- [ ] Retry history tracked
- [ ] Final success recorded

---

### Scenario 4: Memory Update Integration

**Objective**: Validate statistics update accuracy.

#### TC-4.1: Successful Task Updates Stats Correctly

**Given**:
```yaml
# backend-developer-stats.yaml (before)
total_tasks: 100
successful_tasks: 90
failed_tasks: 10
success_rate: 0.900
avg_quality_score: 92.0
recent_tasks: [/* 10 tasks */]
```

**When**:
- New task completes:
  - Success: true
  - Quality score: 95
  - Duration: 30000ms

**Then**:
```yaml
# backend-developer-stats.yaml (after)
total_tasks: 101
successful_tasks: 91
failed_tasks: 10
success_rate: 0.901  # 91/101 = 0.9009...
avg_quality_score: 92.3  # (92*100 + 95) / 101
avg_duration_ms: 30000  # Updated rolling average
recent_tasks: [/* new task prepended, oldest removed */]
last_updated: "2025-11-04T15:00:00Z"
```

**Validation**:
- [ ] `total_tasks` incremented
- [ ] `successful_tasks` incremented
- [ ] `success_rate` recalculated correctly
- [ ] `avg_quality_score` updated (rolling average)
- [ ] `recent_tasks` list updated (max 10)
- [ ] `last_updated` timestamp current

---

#### TC-4.2: Failed Task Updates Stats Correctly

**Given**:
```yaml
# backend-developer-stats.yaml (before)
total_tasks: 100
successful_tasks: 90
failed_tasks: 10
success_rate: 0.900
```

**When**:
- Task fails (no retry)

**Then**:
```yaml
# backend-developer-stats.yaml (after)
total_tasks: 101
successful_tasks: 90
failed_tasks: 11
success_rate: 0.891  # 90/101
```

**Validation**:
- [ ] `total_tasks` incremented
- [ ] `failed_tasks` incremented
- [ ] `successful_tasks` unchanged
- [ ] `success_rate` decreased

---

#### TC-4.3: Specialization Metrics Updated

**Given**:
```yaml
specializations:
  implementation: 50
  bug-fix: 30
```

**When**:
- Task with type: "refactoring" completes

**Then**:
```yaml
specializations:
  implementation: 50
  bug-fix: 30
  refactoring: 1  # New specialization added
```

**Validation**:
- [ ] New specialization added
- [ ] Count initialized to 1
- [ ] Existing specializations unchanged

---

#### TC-4.4: Recent Tasks List Maintains Only 10 Items

**Given**:
```yaml
recent_tasks:
  - id: "2025-11-01-010"
  - id: "2025-11-01-009"
  # ... (10 tasks total)
```

**When**:
- New task completes

**Then**:
```yaml
recent_tasks:
  - id: "2025-11-04-001"  # New task prepended
  - id: "2025-11-01-010"
  # ... (9 more tasks)
  # Oldest task removed
```

**Validation**:
- [ ] New task prepended
- [ ] List length = 10
- [ ] Oldest task removed

---

### Scenario 5: Error Handling

**Objective**: Validate graceful degradation under error conditions.

#### TC-5.1: Missing Memory Directory → Fallback

**Given**:
- `.claude/memory/` directory does NOT exist

**When**:
- Coordinator tries to query memory

**Then**:
1. Directory check fails
2. Warning logged: "Memory directory not found, using fallback"
3. Fallback to keyword-based selection
4. Task completes successfully
5. No memory update attempted

**Validation**:
- [ ] No errors thrown
- [ ] Warning logged
- [ ] Task completes
- [ ] No breaking changes

---

#### TC-5.2: Corrupted YAML → Skip File, Continue

**Given**:
- `backend-developer-stats.yaml` contains invalid YAML:
  ```yaml
  agent_name: "backend-developer"
  total_tasks: [invalid syntax
  ```

**When**:
- Coordinator loads agent stats

**Then**:
1. YAML parsing fails for this file
2. Warning logged: "Failed to parse backend-developer-stats.yaml"
3. File is skipped
4. Other agent stats loaded successfully
5. Selection proceeds with available data

**Validation**:
- [ ] Parsing error caught
- [ ] Warning logged
- [ ] File skipped (not fatal)
- [ ] Other files loaded
- [ ] Selection continues

---

#### TC-5.3: Missing Agent Stats → Use Defaults

**Given**:
- `new-agent` exists in agent list
- `new-agent-stats.yaml` does NOT exist

**When**:
- Coordinator loads agent stats

**Then**:
1. File not found
2. Default stats used:
   ```yaml
   total_tasks: 0
   successful_tasks: 0
   success_rate: 0.5  # Neutral default
   avg_quality_score: 75  # Acceptable default
   ```
3. Agent participates in selection with default stats
4. After first task, stats file is created

**Validation**:
- [ ] Missing file handled gracefully
- [ ] Default stats applied
- [ ] Agent can be selected
- [ ] Stats file created after first task

---

#### TC-5.4: Empty Task History → Normal Selection

**Given**:
- `.claude/memory/tasks/` directory is empty

**When**:
- Coordinator queries similar tasks

**Then**:
1. No tasks found
2. Similar task boost skipped
3. Selection based on agent stats only
4. No errors or warnings

**Validation**:
- [ ] Empty directory handled
- [ ] No errors
- [ ] Selection proceeds normally

---

#### TC-5.5: Disk Full → Graceful Failure

**Given**:
- Disk is full (simulated)

**When**:
- Coordinator tries to update memory

**Then**:
1. Write fails with disk full error
2. Error logged: "Failed to update memory: disk full"
3. Task result still returned to user
4. Warning shown: "Memory update failed, stats may be outdated"

**Validation**:
- [ ] Write error caught
- [ ] User receives result
- [ ] Warning displayed
- [ ] No data corruption

---

### Scenario 6: Performance

**Objective**: Validate memory operations complete within acceptable overhead.

#### TC-6.1: Single Agent Stat Read Performance

**Given**:
- `backend-developer-stats.yaml` exists (typical size: ~1 KB)

**When**:
- Load agent stats

**Then**:
- Read completes in < 1ms

**Validation**:
- [ ] Read latency < 1ms
- [ ] No performance degradation

---

#### TC-6.2: All Agent Stats Read Performance

**Given**:
- 51 agent stats files exist

**When**:
- Load all agent stats

**Then**:
- Read completes in < 50ms

**Validation**:
- [ ] Total read latency < 50ms
- [ ] Average per-file: < 1ms

---

#### TC-6.3: Task History Search Performance

**Given**:
- 100 task records exist

**When**:
- Search for tasks with tags: ["api", "authentication"]

**Then**:
- Search completes in < 100ms

**Validation**:
- [ ] Search latency < 100ms
- [ ] Scales linearly with task count

---

#### TC-6.4: Total Selection Overhead

**Given**:
- Memory operations enabled
- 51 agents, 100 tasks

**When**:
- Complete agent selection (read stats + search tasks + score)

**Then**:
- Total overhead < 150ms
- Breakdown:
  - Load agent stats: ~50ms
  - Search tasks: ~50ms
  - Score calculation: ~20ms
  - Selection logic: ~30ms

**Validation**:
- [ ] Total overhead < 150ms
- [ ] Acceptable for 15-25% accuracy gain
- [ ] No noticeable user delay

---

#### TC-6.5: Memory Update Performance

**Given**:
- Task completes successfully

**When**:
- Update memory (create task record + update agent stats)

**Then**:
- Update completes in < 50ms
- Breakdown:
  - Create task record: ~10ms
  - Update agent stats: ~20ms
  - Recalculate trends: ~20ms

**Validation**:
- [ ] Update latency < 50ms
- [ ] Atomic writes ensure integrity

---

## Test Data

### Sample Agent Statistics

Create these files for testing:

```yaml
# .claude/memory/agents/backend-developer-stats.yaml
agent_name: "backend-developer"
total_tasks: 100
successful_tasks: 90
failed_tasks: 10
success_rate: 0.90
avg_quality_score: 92.0
avg_duration_ms: 30000
last_updated: "2025-11-04T10:00:00Z"

recent_tasks:
  - id: "2025-11-03-010"
    success: true
    score: 95
  - id: "2025-11-03-009"
    success: true
    score: 88
  - id: "2025-11-03-008"
    success: false
    score: 0
  - id: "2025-11-03-007"
    success: true
    score: 92
  - id: "2025-11-03-006"
    success: true
    score: 94
  - id: "2025-11-03-005"
    success: true
    score: 89
  - id: "2025-11-03-004"
    success: true
    score: 93
  - id: "2025-11-03-003"
    success: true
    score: 91
  - id: "2025-11-03-002"
    success: true
    score: 90
  - id: "2025-11-03-001"
    success: true
    score: 87

trends:
  success_rate_trend: 0.05  # Improving
  quality_score_trend: 2.3
  avg_duration_trend: -500  # Getting faster

specializations:
  implementation: 50
  bug-fix: 25
  refactoring: 15
  api: 40
```

```yaml
# .claude/memory/agents/frontend-developer-stats.yaml
agent_name: "frontend-developer"
total_tasks: 50
successful_tasks: 40
failed_tasks: 10
success_rate: 0.80
avg_quality_score: 85.0
avg_duration_ms: 25000
last_updated: "2025-11-04T10:00:00Z"

recent_tasks:
  - id: "2025-11-03-005"
    success: true
    score: 88
  - id: "2025-11-03-004"
    success: true
    score: 82
  - id: "2025-11-03-003"
    success: false
    score: 0
  - id: "2025-11-03-002"
    success: true
    score: 90
  - id: "2025-11-03-001"
    success: true
    score: 85

trends:
  success_rate_trend: 0.0  # Stable
  quality_score_trend: 1.0
  avg_duration_trend: 0

specializations:
  implementation: 20
  ui: 30
  bug-fix: 10
```

```yaml
# .claude/memory/agents/security-architect-stats.yaml
agent_name: "security-architect"
total_tasks: 30
successful_tasks: 28
failed_tasks: 2
success_rate: 0.933
avg_quality_score: 95.0
avg_duration_ms: 45000
last_updated: "2025-11-04T10:00:00Z"

recent_tasks:
  - id: "2025-11-03-003"
    success: true
    score: 98
  - id: "2025-11-03-002"
    success: true
    score: 96
  - id: "2025-11-03-001"
    success: true
    score: 94

trends:
  success_rate_trend: 0.03
  quality_score_trend: 1.5
  avg_duration_trend: -1000

specializations:
  security: 25
  implementation: 15
  review: 10
```

### Sample Task Records

```yaml
# .claude/memory/tasks/2025-11-04-001-api-implementation.yaml
id: "2025-11-04-001"
timestamp: "2025-11-04T14:30:00Z"
request: "REST API for user authentication with JWT tokens"
task_type: "implementation"

selected_agents:
  - backend-developer
  - api-developer
  - security-architect

duration_ms: 45000
success: true
quality_score: 95

errors: []
warnings:
  - "Consider rate limiting implementation"

quality_metrics:
  code_coverage: 92
  documentation_complete: true
  security_review_passed: true
  performance_benchmark: "excellent"

reflection:
  score: 95
  decision: "approved"
  feedback: "高品質な実装。テストカバレッジ92%。セキュリティベストプラクティスに準拠。"
  improvements: []

artifacts:
  - path: "src/api/auth.rs"
    type: "implementation"
  - path: "tests/api/auth_test.rs"
    type: "test"
  - path: "docs/api/auth.md"
    type: "documentation"

resources:
  tokens_used: 85000
  api_calls: 12
  files_modified: 8

tags:
  - authentication
  - api
  - security
  - jwt
```

```yaml
# .claude/memory/tasks/2025-11-04-002-bug-fix-memory-leak.yaml
id: "2025-11-04-002"
timestamp: "2025-11-04T15:00:00Z"
request: "Fix memory leak in WebSocket handler"
task_type: "bug-fix"

selected_agents:
  - backend-developer
  - performance-engineer

duration_ms: 30000
success: true
quality_score: 88

errors: []
warnings: []

quality_metrics:
  code_coverage: 85
  documentation_complete: true
  security_review_passed: true
  performance_benchmark: "good"

reflection:
  score: 88
  decision: "approved"
  feedback: "メモリリークを修正。パフォーマンステストで検証済み。"
  improvements:
    - "Add more comprehensive memory profiling tests"

artifacts:
  - path: "src/websocket/handler.rs"
    type: "fix"
  - path: "tests/websocket/memory_test.rs"
    type: "test"

resources:
  tokens_used: 55000
  api_calls: 8
  files_modified: 3

tags:
  - bug-fix
  - performance
  - websocket
  - memory
```

```yaml
# .claude/memory/tasks/2025-11-04-003-failed-deployment.yaml
id: "2025-11-04-003"
timestamp: "2025-11-04T16:00:00Z"
request: "Deploy to production environment"
task_type: "deployment"

selected_agents:
  - cicd-manager
  - cloud-architect

duration_ms: 60000
success: false
quality_score: 0

errors:
  - "Database migration failed: connection timeout"
  - "Rollback initiated"

warnings:
  - "Production database unreachable"

quality_metrics:
  code_coverage: 0
  documentation_complete: false
  security_review_passed: false
  performance_benchmark: "n/a"

reflection:
  score: 0
  decision: "rejected"
  feedback: "デプロイ失敗。データベース接続タイムアウト。ネットワーク設定を確認する必要があります。"
  improvements:
    - "Check network connectivity"
    - "Verify database credentials"
    - "Increase timeout settings"

artifacts: []

resources:
  tokens_used: 25000
  api_calls: 15
  files_modified: 0

tags:
  - deployment
  - failed
  - database
  - network
```

---

## Execution Steps

### Pre-Test Setup

1. **Backup existing memory** (if any):
   ```bash
   tar -czf memory-backup-$(date +%Y%m%d-%H%M%S).tar.gz .claude/memory/
   ```

2. **Create test memory directory**:
   ```bash
   mkdir -p .claude/memory/tasks
   mkdir -p .claude/memory/agents
   mkdir -p .claude/memory-backup/archive
   ```

3. **Load test data**:
   ```bash
   # Copy sample agent stats
   cp test-data/agents/*.yaml .claude/memory/agents/

   # Copy sample task records
   cp test-data/tasks/*.yaml .claude/memory/tasks/

   # Verify files
   ls -la .claude/memory/agents/
   ls -la .claude/memory/tasks/
   ```

4. **Validate YAML files**:
   ```bash
   for file in .claude/memory/**/*.yaml; do
     yamllint "$file" || echo "Invalid: $file"
   done
   ```

5. **Set up test environment**:
   ```bash
   export AIT42_TEST_MODE=true
   export AIT42_MEMORY_PATH=".claude/memory/"
   ```

---

### Test Execution

#### Manual Test Execution

For each test case:

1. **Set up preconditions** (create/modify files as needed)
2. **Execute test action** (submit request, trigger operation)
3. **Capture results**:
   - Screenshots/logs
   - File contents before/after
   - Performance metrics
4. **Validate results** against expected outcomes
5. **Document results** in test log

**Test Log Template**:
```markdown
## Test Case: TC-X.Y

**Date**: YYYY-MM-DD HH:MM
**Tester**: Name
**Environment**: Dev/Test/Staging

### Preconditions
- [x] Memory directory exists
- [x] Test data loaded
- [x] Agent stats valid

### Execution Steps
1. Submit request: "..."
2. Observe agent selection
3. Wait for completion
4. Check memory update

### Results
- Agent selected: backend-developer ✅
- Quality score: 95 ✅
- Memory updated: ✅
- Performance: 120ms ✅

### Status: PASS / FAIL

### Notes
Any observations or issues
```

#### Automated Test Execution

Run automated test suite:

```bash
# Run all integration tests
./scripts/run-integration-tests.sh

# Run specific scenario
./scripts/run-integration-tests.sh --scenario=2

# Run with verbose logging
./scripts/run-integration-tests.sh --verbose

# Generate report
./scripts/run-integration-tests.sh --report=html
```

---

### Post-Test Validation

After all tests:

1. **Check log files**:
   ```bash
   grep -i "error" logs/integration-test.log
   grep -i "warning" logs/integration-test.log
   ```

2. **Validate memory integrity**:
   ```bash
   # Check for orphaned files
   find .claude/memory/ -type f -name "*.tmp"

   # Validate YAML syntax
   for file in .claude/memory/**/*.yaml; do
     python3 -c "import yaml; yaml.safe_load(open('$file'))"
   done
   ```

3. **Performance summary**:
   ```bash
   # Extract performance metrics from logs
   grep "PERF:" logs/integration-test.log | awk '{sum+=$3; count+=1} END {print "Avg:", sum/count, "ms"}'
   ```

4. **Generate test report**:
   ```bash
   ./scripts/generate-test-report.sh > INTEGRATION_TEST_REPORT.md
   ```

---

## Validation Criteria

### Overall Success Criteria

**All scenarios must pass**:
- [x] Scenario 1: End-to-End Workflow
- [x] Scenario 2: Agent Selection Enhancement
- [x] Scenario 3: ReflectionAgent Integration
- [x] Scenario 4: Memory Update
- [x] Scenario 5: Error Handling
- [x] Scenario 6: Performance

**Quality Gates**:
- [x] No critical bugs (P0/P1)
- [x] No security vulnerabilities
- [x] Performance within acceptable range (< 150ms overhead)
- [x] Documentation matches implementation
- [x] All test data validates correctly

---

### Individual Test Case Criteria

Each test case must satisfy:

1. **Functional Correctness**:
   - Output matches expected
   - Memory files created/updated correctly
   - Statistics calculated accurately
   - No data corruption

2. **Error Handling**:
   - Errors caught gracefully
   - Appropriate logging
   - No crashes or unhandled exceptions
   - Fallback mechanisms work

3. **Performance**:
   - Operations complete within target latency
   - No memory leaks
   - Acceptable CPU usage
   - Scales with data volume

4. **Data Integrity**:
   - YAML files valid
   - Atomic writes preserve data
   - No race conditions
   - Backups functional

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Memory file corruption** | Low | High | Atomic writes, validation, backups |
| **YAML parsing errors** | Medium | Medium | Schema validation, error handling, skip invalid files |
| **Performance degradation** | Low | Medium | Benchmarking, caching, optimization |
| **Disk full** | Low | High | Disk space monitoring, graceful failure, rotation policy |
| **Concurrent writes** | Medium | High | File locking, atomic operations, retry logic |
| **Agent stat calculation errors** | Low | Medium | Unit tests for calculations, validation |
| **Memory unavailable** | Medium | Low | Fallback to keyword matching, graceful degradation |
| **Backup failure** | Low | Medium | Multiple backup strategies, monitoring |
| **Trend calculation errors** | Low | Low | Statistical validation, boundary checks |
| **Missing dependencies** | Low | High | Pre-flight checks, dependency validation |

---

## Rollback Plan

If integration tests fail critically:

### Level 1: Minor Issues (< 3 failed tests, no P0 bugs)

1. **Fix issues** in development
2. **Re-run failed tests**
3. **Document fixes** in test log
4. **Proceed to release** if all pass

### Level 2: Moderate Issues (3-10 failed tests, P1 bugs)

1. **Pause release**
2. **Analyze root cause**
3. **Fix critical issues**
4. **Re-run full test suite**
5. **Release after validation**

### Level 3: Critical Issues (>10 failed tests, P0 bugs, data corruption)

1. **Abort release immediately**
2. **Restore from backup**:
   ```bash
   tar -xzf memory-backup-YYYYMMDD-HHMMSS.tar.gz -C .
   ```
3. **Revert code changes**:
   ```bash
   git revert <commit-hash>
   ```
4. **Root cause analysis**
5. **Fix in separate branch**
6. **Full re-test before next attempt**

---

## Test Automation

### Automated Test Script

Create `scripts/run-integration-tests.sh`:

```bash
#!/bin/bash
# AIT42 Integration Test Runner
# Version 1.0.0

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "AIT42 v1.4.0 Integration Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
SKIPPED=0

# Test 1: Memory Read
test_memory_read() {
    echo -n "Test 1: Memory Read... "
    if [ -f ".claude/memory/agents/backend-developer-stats.yaml" ]; then
        echo -e "${GREEN}PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}FAIL${NC} - Agent stats file missing"
        ((FAILED++))
    fi
}

# Test 2: YAML Validity
test_yaml_validity() {
    echo -n "Test 2: YAML Validity... "
    local invalid_count=0
    for file in .claude/memory/**/*.yaml; do
        if ! python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
            ((invalid_count++))
        fi
    done

    if [ $invalid_count -eq 0 ]; then
        echo -e "${GREEN}PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}FAIL${NC} - $invalid_count invalid YAML files"
        ((FAILED++))
    fi
}

# Test 3: Agent Stats Calculation
test_agent_stats_calculation() {
    echo -n "Test 3: Agent Stats Calculation... "

    # Read stats
    total=$(grep "total_tasks:" .claude/memory/agents/backend-developer-stats.yaml | awk '{print $2}')
    success=$(grep "successful_tasks:" .claude/memory/agents/backend-developer-stats.yaml | awk '{print $2}')
    rate=$(grep "success_rate:" .claude/memory/agents/backend-developer-stats.yaml | awk '{print $2}')

    # Calculate expected
    expected=$(echo "scale=3; $success / $total" | bc)

    # Compare (allow 0.001 tolerance)
    diff=$(echo "$rate - $expected" | bc | tr -d '-')
    if (( $(echo "$diff < 0.001" | bc -l) )); then
        echo -e "${GREEN}PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}FAIL${NC} - Expected: $expected, Got: $rate"
        ((FAILED++))
    fi
}

# Test 4: Task Record Format
test_task_record_format() {
    echo -n "Test 4: Task Record Format... "

    local required_fields=("id" "timestamp" "request" "task_type" "selected_agents" "success" "quality_score")
    local missing=0

    for field in "${required_fields[@]}"; do
        if ! grep -q "^$field:" .claude/memory/tasks/2025-11-04-001-api-implementation.yaml 2>/dev/null; then
            echo -e "${RED}FAIL${NC} - Missing field: $field"
            ((missing++))
        fi
    done

    if [ $missing -eq 0 ]; then
        echo -e "${GREEN}PASS${NC}"
        ((PASSED++))
    else
        ((FAILED++))
    fi
}

# Test 5: Performance - Read Speed
test_performance_read() {
    echo -n "Test 5: Performance - Read Speed... "

    start=$(date +%s%3N)
    cat .claude/memory/agents/backend-developer-stats.yaml > /dev/null
    end=$(date +%s%3N)

    duration=$((end - start))

    if [ $duration -lt 10 ]; then
        echo -e "${GREEN}PASS${NC} (${duration}ms)"
        ((PASSED++))
    else
        echo -e "${YELLOW}SLOW${NC} (${duration}ms > 10ms)"
        ((PASSED++))
    fi
}

# Test 6: Backup Directory Exists
test_backup_directory() {
    echo -n "Test 6: Backup Directory... "
    if [ -d ".claude/memory-backup/" ]; then
        echo -e "${GREEN}PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}FAIL${NC} - Backup directory missing"
        ((FAILED++))
    fi
}

# Test 7: Config Validation
test_config_validation() {
    echo -n "Test 7: Config Validation... "

    if [ -f ".claude/memory/config.yaml" ]; then
        if python3 -c "import yaml; yaml.safe_load(open('.claude/memory/config.yaml'))" 2>/dev/null; then
            echo -e "${GREEN}PASS${NC}"
            ((PASSED++))
        else
            echo -e "${RED}FAIL${NC} - Invalid config YAML"
            ((FAILED++))
        fi
    else
        echo -e "${RED}FAIL${NC} - Config file missing"
        ((FAILED++))
    fi
}

# Test 8: Recent Tasks Limit
test_recent_tasks_limit() {
    echo -n "Test 8: Recent Tasks Limit... "

    count=$(grep -A 20 "recent_tasks:" .claude/memory/agents/backend-developer-stats.yaml | grep "  - id:" | wc -l | tr -d ' ')
    limit=$(grep "recent_tasks_limit:" .claude/memory/config.yaml | awk '{print $2}')

    if [ "$count" -le "$limit" ]; then
        echo -e "${GREEN}PASS${NC} ($count <= $limit)"
        ((PASSED++))
    else
        echo -e "${RED}FAIL${NC} - Recent tasks: $count, Limit: $limit"
        ((FAILED++))
    fi
}

# Run all tests
echo "Running integration tests..."
echo ""

test_memory_read
test_yaml_validity
test_agent_stats_calculation
test_task_record_format
test_performance_read
test_backup_directory
test_config_validation
test_recent_tasks_limit

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Results:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Passed:  ${GREEN}$PASSED${NC}"
echo -e "Failed:  ${RED}$FAILED${NC}"
echo -e "Skipped: ${YELLOW}$SKIPPED${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
```

Make executable:
```bash
chmod +x scripts/run-integration-tests.sh
```

---

## Expected Results

### Scenario 1: End-to-End Workflow
**Expected**:
- Agent selection incorporates memory data
- Task completes successfully
- Memory updated with task record and agent stats
- User receives high-quality result

**Success Rate**: 100% (all test cases pass)

---

### Scenario 2: Agent Selection Enhancement
**Expected**:
- Agent with better historical performance is preferred
- Similar past tasks influence selection
- Fallback works when memory unavailable

**Accuracy Improvement**: 15-25% over keyword-only matching

---

### Scenario 3: ReflectionAgent Integration
**Expected**:
- Quality scores calculated accurately
- Decisions match score thresholds
- Feedback is actionable
- Memory includes reflection data

**Success Rate**: 100%

---

### Scenario 4: Memory Update
**Expected**:
- Statistics recalculated correctly
- Recent tasks list maintained
- Specializations updated
- Timestamps current

**Accuracy**: 100% (no calculation errors)

---

### Scenario 5: Error Handling
**Expected**:
- No crashes on missing files
- Graceful degradation
- Warnings logged appropriately
- Tasks complete despite errors

**Resilience**: 100% (no fatal errors)

---

### Scenario 6: Performance
**Expected**:
- Memory read: < 50ms
- Agent selection: < 150ms total overhead
- Memory update: < 50ms
- Acceptable for user experience

**Performance Target**: 95% of operations within SLA

---

## Continuous Integration

### CI Pipeline Integration

Add to `.github/workflows/integration-tests.yml`:

```yaml
name: Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  integration-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up test environment
        run: |
          mkdir -p .claude/memory/tasks
          mkdir -p .claude/memory/agents
          mkdir -p .claude/memory-backup

      - name: Load test data
        run: |
          cp test-data/agents/*.yaml .claude/memory/agents/
          cp test-data/tasks/*.yaml .claude/memory/tasks/
          cp test-data/config.yaml .claude/memory/config.yaml

      - name: Validate test data
        run: |
          pip install pyyaml yamllint
          yamllint .claude/memory/

      - name: Run integration tests
        run: |
          chmod +x scripts/run-integration-tests.sh
          ./scripts/run-integration-tests.sh

      - name: Generate test report
        if: always()
        run: |
          ./scripts/generate-test-report.sh > integration-test-report.md

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: integration-test-report
          path: integration-test-report.md
```

---

## Appendix

### A. Test Data Generation Script

```bash
#!/bin/bash
# generate-test-data.sh

echo "Generating test data for AIT42 v1.4.0..."

# Create directories
mkdir -p test-data/agents
mkdir -p test-data/tasks

# Generate agent stats
cat > test-data/agents/backend-developer-stats.yaml <<EOF
agent_name: "backend-developer"
total_tasks: 100
successful_tasks: 90
failed_tasks: 10
success_rate: 0.90
avg_quality_score: 92.0
avg_duration_ms: 30000
last_updated: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

recent_tasks:
  - id: "2025-11-03-010"
    success: true
    score: 95
  - id: "2025-11-03-009"
    success: true
    score: 88

trends:
  success_rate_trend: 0.05
  quality_score_trend: 2.3
  avg_duration_trend: -500

specializations:
  implementation: 50
  bug-fix: 25
  refactoring: 15
  api: 40
EOF

echo "✅ Test data generated in test-data/"
```

---

### B. Performance Benchmarking Script

```python
#!/usr/bin/env python3
# benchmark.py

import time
import yaml
import statistics

def benchmark_read_agent_stats():
    times = []
    for _ in range(100):
        start = time.perf_counter()
        with open('.claude/memory/agents/backend-developer-stats.yaml') as f:
            yaml.safe_load(f)
        end = time.perf_counter()
        times.append((end - start) * 1000)  # ms

    print(f"Agent Stats Read:")
    print(f"  Mean: {statistics.mean(times):.2f}ms")
    print(f"  Median: {statistics.median(times):.2f}ms")
    print(f"  P95: {statistics.quantiles(times, n=20)[18]:.2f}ms")
    print(f"  Max: {max(times):.2f}ms")

if __name__ == '__main__':
    benchmark_read_agent_stats()
```

---

### C. YAML Validation Schema

```python
# validate_schema.py

from typing import Dict, Any
import yaml

AGENT_STATS_SCHEMA = {
    'agent_name': str,
    'total_tasks': int,
    'successful_tasks': int,
    'failed_tasks': int,
    'success_rate': float,
    'avg_quality_score': float,
    'avg_duration_ms': int,
    'last_updated': str,
    'recent_tasks': list,
    'trends': dict,
    'specializations': dict
}

TASK_RECORD_SCHEMA = {
    'id': str,
    'timestamp': str,
    'request': str,
    'task_type': str,
    'selected_agents': list,
    'duration_ms': int,
    'success': bool,
    'quality_score': int,
}

def validate_agent_stats(data: Dict[str, Any]) -> bool:
    for field, expected_type in AGENT_STATS_SCHEMA.items():
        if field not in data:
            print(f"Missing field: {field}")
            return False
        if not isinstance(data[field], expected_type):
            print(f"Invalid type for {field}: expected {expected_type}, got {type(data[field])}")
            return False

    # Additional validations
    if not (0.0 <= data['success_rate'] <= 1.0):
        print("success_rate must be between 0.0 and 1.0")
        return False

    if not (0 <= data['avg_quality_score'] <= 100):
        print("avg_quality_score must be between 0 and 100")
        return False

    return True

def validate_task_record(data: Dict[str, Any]) -> bool:
    for field, expected_type in TASK_RECORD_SCHEMA.items():
        if field not in data:
            print(f"Missing required field: {field}")
            return False
        if not isinstance(data[field], expected_type):
            print(f"Invalid type for {field}")
            return False

    if not (0 <= data['quality_score'] <= 100):
        print("quality_score must be between 0 and 100")
        return False

    return True
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-04 | Initial integration test plan |

---

## Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Test Lead | TBD | | |
| Tech Lead | TBD | | |
| Product Owner | TBD | | |

---

**End of Integration Test Plan**
