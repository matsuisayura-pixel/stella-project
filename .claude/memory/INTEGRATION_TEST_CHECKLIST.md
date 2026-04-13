# AIT42 v1.4.0 Integration Test Execution Checklist

**Version**: 1.0.0
**Test Date**: _______________
**Tester**: _______________
**Environment**: [ ] Dev [ ] Test [ ] Staging

---

## Pre-Test Setup

### Environment Preparation
- [ ] Backup existing `.claude/memory/` directory
  ```bash
  tar -czf memory-backup-$(date +%Y%m%d-%H%M%S).tar.gz .claude/memory/
  ```
- [ ] Create test memory directories
  ```bash
  mkdir -p .claude/memory/tasks
  mkdir -p .claude/memory/agents
  mkdir -p .claude/memory-backup/archive
  ```
- [ ] Load test data (agents and tasks)
- [ ] Verify YAML validity of test data
  ```bash
  yamllint .claude/memory/
  ```
- [ ] Set test environment variables
  ```bash
  export AIT42_TEST_MODE=true
  export AIT42_MEMORY_PATH=".claude/memory/"
  ```

### Pre-Flight Checks
- [ ] Git repository is clean (no uncommitted changes)
- [ ] AIT42 services are running
- [ ] Sufficient disk space (> 1GB free)
- [ ] Python 3.x installed (for YAML validation)
- [ ] `yamllint` installed

---

## Scenario 1: End-to-End Workflow with Memory

### TC-1.1: Successful Task with Memory Enhancement

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Verify test data loaded (backend-developer: 100 tasks, 90% success)
- [ ] 2. Submit user request: "REST APIエンドポイントを実装してください"
- [ ] 3. Observe Coordinator querying memory
- [ ] 4. Verify `backend-developer` selected (higher success rate)
- [ ] 5. Wait for task completion
- [ ] 6. Verify ReflectionAgent evaluation (expected: ACCEPT, score: 95)
- [ ] 7. Check task record created: `.claude/memory/tasks/2025-11-04-XXX-rest-api-endpoint.yaml`
- [ ] 8. Verify agent stats updated:
  - [ ] `total_tasks`: 101 ✓
  - [ ] `successful_tasks`: 91 ✓
  - [ ] `success_rate`: ~0.901 ✓
  - [ ] `recent_tasks`: Updated ✓

**Expected Result**:
- Agent selection uses memory data
- Task completes successfully
- Memory updated correctly
- User receives result

**Actual Result**:
```
[Notes here]
```

**Pass/Fail**: ___________

---

### TC-1.2: Failed Task with Retry

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Simulate task failure (inject error)
- [ ] 2. Verify ReflectionAgent decision: "REJECT"
- [ ] 3. Observe auto-retry triggered
- [ ] 4. Verify retry succeeds (score: 75)
- [ ] 5. Check memory updated:
  - [ ] Task record shows retry history
  - [ ] `failed_tasks`: Incremented
  - [ ] `successful_tasks`: Incremented (final success)
  - [ ] Retry attempts logged

**Expected Result**:
- Retry triggered automatically
- Failed and successful attempts both tracked
- Final success recorded

**Actual Result**:
```
[Notes here]
```

**Pass/Fail**: ___________

---

### TC-1.3: Medium Quality Task Requiring Improvement

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Execute task with expected quality: 72
- [ ] 2. Verify ReflectionAgent decision: "IMPROVE"
- [ ] 3. Check user prompt: "結果の品質は72点です。改善しますか?"
- [ ] 4. Accept improvement
- [ ] 5. Verify improved quality: 88
- [ ] 6. Check memory:
  - [ ] Task record shows improvement cycle
  - [ ] Both attempts recorded

**Expected Result**:
- User prompted for improvement
- Improvement executed
- Both attempts tracked

**Actual Result**:
```
[Notes here]
```

**Pass/Fail**: ___________

---

## Scenario 2: Memory-Enhanced Agent Selection

### TC-2.1: Prefer High Success Rate Agent

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Load agent stats:
  - [ ] `backend-developer`: 95% success, 93 quality, 50 API tasks
  - [ ] `frontend-developer`: 70% success, 78 quality, 0 API tasks
- [ ] 2. Submit request: "新しいAPI機能を実装"
- [ ] 3. Observe agent scoring:
  - [ ] backend-developer: ~0.736
  - [ ] frontend-developer: ~0.514
- [ ] 4. Verify selection: `backend-developer`
- [ ] 5. Check logs for selection rationale

**Expected Result**:
- `backend-developer` selected
- Score calculation correct
- Selection rationale logged

**Actual Result**:
```
[Notes here]
```

**Pass/Fail**: ___________

---

### TC-2.2: Fallback to Keyword Matching When No Memory

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Rename `.claude/memory/` to `.claude/memory-disabled/`
- [ ] 2. Submit request: "バックエンドAPIを実装"
- [ ] 3. Verify memory read fails gracefully
- [ ] 4. Check warning logged: "Memory unavailable, using keyword fallback"
- [ ] 5. Verify keyword matching works:
  - [ ] Keywords: ["バックエンド", "API", "実装"]
  - [ ] Matches: `backend-developer`, `api-developer`
- [ ] 6. Verify task completes successfully
- [ ] 7. Restore memory directory

**Expected Result**:
- No errors thrown
- Keyword matching works
- Task completes
- Warning logged

**Actual Result**:
```
[Notes here]
```

**Pass/Fail**: ___________

---

### TC-2.3: Similar Past Task Influences Selection

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Create similar task record:
  ```yaml
  id: "2025-11-01-001"
  tags: [authentication, api, security]
  selected_agents: [security-architect, backend-developer]
  success: true
  quality_score: 98
  ```
- [ ] 2. Submit request: "OAuth2認証を実装してください"
- [ ] 3. Verify Coordinator finds similar task
- [ ] 4. Check agents boosted:
  - [ ] `security-architect`: +10% priority
  - [ ] `backend-developer`: +10% priority
- [ ] 5. Verify selection includes both agents

**Expected Result**:
- Similar tasks found
- Agents from similar tasks prioritized
- Selection includes relevant agents

**Actual Result**:
```
[Notes here]
```

**Pass/Fail**: ___________

---

## Scenario 3: ReflectionAgent Integration

### TC-3.1: High Quality Result (Score: 95) → ACCEPT

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Execute task with expected quality: 95
- [ ] 2. Verify ReflectionAgent evaluation:
  - [ ] Code Quality: 95
  - [ ] Documentation: 95
  - [ ] Security: 95
  - [ ] Performance: 95
  - [ ] Average: 95
- [ ] 3. Verify decision: "ACCEPT"
- [ ] 4. Check feedback: "高品質な実装です。すべての基準を満たしています。"
- [ ] 5. Verify memory updated:
  - [ ] Task record includes reflection score
  - [ ] Agent quality score updated

**Expected Result**:
- Score calculated correctly (4 dimensions)
- Decision is "ACCEPT"
- Feedback provided
- Memory updated

**Actual Result**:
```
[Notes here]
```

**Pass/Fail**: ___________

---

### TC-3.2: Medium Quality Result (Score: 80) → IMPROVE

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Execute task with:
  - [ ] Code Quality: 85
  - [ ] Documentation: 70 (below threshold)
  - [ ] Security: 90
  - [ ] Performance: 75
  - [ ] Average: 80
- [ ] 2. Verify decision: "IMPROVE"
- [ ] 3. Check feedback identifies weak dimension: "ドキュメントが不足しています"
- [ ] 4. User accepts improvement
- [ ] 5. Verify new score: 92
- [ ] 6. Check improvement tracked in memory

**Expected Result**:
- Score identifies weak dimension
- Decision is "IMPROVE"
- Specific feedback provided
- Improvement cycle tracked

**Actual Result**:
```
[Notes here]
```

**Pass/Fail**: ___________

---

### TC-3.3: Low Quality Result (Score: 60) → REJECT → Auto-Retry

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Execute task with quality: 60
- [ ] 2. Verify decision: "REJECT"
- [ ] 3. Check feedback: "品質基準を満たしていません。再実行します。"
- [ ] 4. Verify auto-retry triggered (attempt 2 of 3)
- [ ] 5. Retry succeeds with score: 78
- [ ] 6. Verify decision: "ACCEPT"
- [ ] 7. Check memory:
  ```yaml
  attempts:
    - attempt: 1
      quality_score: 60
      decision: "REJECT"
    - attempt: 2
      quality_score: 78
      decision: "ACCEPT"
  ```

**Expected Result**:
- Low quality triggers REJECT
- Auto-retry executed
- Retry history tracked
- Final success recorded

**Actual Result**:
```
[Notes here]
```

**Pass/Fail**: ___________

---

## Scenario 4: Memory Update Integration

### TC-4.1: Successful Task Updates Stats Correctly

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Record initial stats:
  ```
  total_tasks: 100
  successful_tasks: 90
  success_rate: 0.900
  avg_quality_score: 92.0
  ```
- [ ] 2. Execute successful task:
  - [ ] Quality score: 95
  - [ ] Duration: 30000ms
- [ ] 3. Verify updated stats:
  - [ ] `total_tasks`: 101 ✓
  - [ ] `successful_tasks`: 91 ✓
  - [ ] `success_rate`: ~0.901 (91/101) ✓
  - [ ] `avg_quality_score`: ~92.3 ✓
  - [ ] `last_updated`: Current timestamp ✓
- [ ] 4. Verify recent_tasks updated:
  - [ ] New task prepended
  - [ ] List length = 10

**Expected Result**:
- All counters incremented
- Averages recalculated correctly
- Recent tasks updated

**Actual Result**:
```
[Notes here]
```

**Pass/Fail**: ___________

---

### TC-4.2: Failed Task Updates Stats Correctly

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Record initial stats:
  ```
  total_tasks: 100
  successful_tasks: 90
  failed_tasks: 10
  ```
- [ ] 2. Execute failed task (no retry)
- [ ] 3. Verify updated stats:
  - [ ] `total_tasks`: 101
  - [ ] `successful_tasks`: 90 (unchanged)
  - [ ] `failed_tasks`: 11
  - [ ] `success_rate`: ~0.891 (90/101)

**Expected Result**:
- `total_tasks` incremented
- `failed_tasks` incremented
- `success_rate` decreased

**Actual Result**:
```
[Notes here]
```

**Pass/Fail**: ___________

---

### TC-4.3: Specialization Metrics Updated

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Record initial specializations:
  ```yaml
  specializations:
    implementation: 50
    bug-fix: 30
  ```
- [ ] 2. Execute task with type: "refactoring"
- [ ] 3. Verify updated:
  ```yaml
  specializations:
    implementation: 50
    bug-fix: 30
    refactoring: 1  # New
  ```

**Expected Result**:
- New specialization added
- Count initialized to 1
- Existing unchanged

**Actual Result**:
```
[Notes here]
```

**Pass/Fail**: ___________

---

### TC-4.4: Recent Tasks List Maintains Only 10 Items

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Verify initial recent_tasks count: 10
- [ ] 2. Execute new task
- [ ] 3. Verify recent_tasks:
  - [ ] New task prepended
  - [ ] List length = 10
  - [ ] Oldest task removed

**Expected Result**:
- New task at position 0
- List length remains 10
- Oldest removed

**Actual Result**:
```
[Notes here]
```

**Pass/Fail**: ___________

---

## Scenario 5: Error Handling

### TC-5.1: Missing Memory Directory → Fallback

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Rename `.claude/memory/` to `.claude/memory-disabled/`
- [ ] 2. Submit request
- [ ] 3. Verify warning logged: "Memory directory not found"
- [ ] 4. Verify fallback to keyword matching
- [ ] 5. Verify task completes successfully
- [ ] 6. Restore directory

**Expected Result**:
- No errors thrown
- Warning logged
- Task completes
- No breaking changes

**Actual Result**:
```
[Notes here]
```

**Pass/Fail**: ___________

---

### TC-5.2: Corrupted YAML → Skip File, Continue

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Create corrupted stats file:
  ```yaml
  agent_name: "test-agent"
  total_tasks: [invalid syntax
  ```
- [ ] 2. Load agent stats
- [ ] 3. Verify warning: "Failed to parse test-agent-stats.yaml"
- [ ] 4. Verify file skipped
- [ ] 5. Verify other files loaded successfully
- [ ] 6. Verify selection continues

**Expected Result**:
- Parsing error caught
- Warning logged
- File skipped (not fatal)
- Selection continues

**Actual Result**:
```
[Notes here]
```

**Pass/Fail**: ___________

---

### TC-5.3: Missing Agent Stats → Use Defaults

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Add `new-agent` to agent list
- [ ] 2. Ensure `new-agent-stats.yaml` does NOT exist
- [ ] 3. Load agent stats
- [ ] 4. Verify defaults used:
  ```yaml
  total_tasks: 0
  success_rate: 0.5  # Neutral
  avg_quality_score: 75  # Acceptable
  ```
- [ ] 5. Verify agent can be selected
- [ ] 6. Execute task with new-agent
- [ ] 7. Verify stats file created after task

**Expected Result**:
- Missing file handled gracefully
- Default stats applied
- Agent can participate
- Stats created after first task

**Actual Result**:
```
[Notes here]
```

**Pass/Fail**: ___________

---

### TC-5.4: Empty Task History → Normal Selection

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Empty `.claude/memory/tasks/` directory
- [ ] 2. Query similar tasks
- [ ] 3. Verify no tasks found
- [ ] 4. Verify similar task boost skipped
- [ ] 5. Verify selection based on agent stats only
- [ ] 6. No errors or warnings

**Expected Result**:
- Empty directory handled
- No errors
- Selection proceeds normally

**Actual Result**:
```
[Notes here]
```

**Pass/Fail**: ___________

---

### TC-5.5: Disk Full → Graceful Failure

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Simulate disk full (limit quota or use mock)
- [ ] 2. Execute task
- [ ] 3. Attempt memory update
- [ ] 4. Verify write fails
- [ ] 5. Verify error logged: "Failed to update memory: disk full"
- [ ] 6. Verify user still receives result
- [ ] 7. Verify warning shown: "Memory update failed, stats may be outdated"

**Expected Result**:
- Write error caught
- User receives result
- Warning displayed
- No data corruption

**Actual Result**:
```
[Notes here]
```

**Pass/Fail**: ___________

---

## Scenario 6: Performance

### TC-6.1: Single Agent Stat Read Performance

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Benchmark single stat read (100 iterations)
- [ ] 2. Measure average latency
- [ ] 3. Verify: Average < 1ms

**Expected Result**: < 1ms average

**Actual Result**: _____ ms

**Pass/Fail**: ___________

---

### TC-6.2: All Agent Stats Read Performance

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Load all 51 agent stats
- [ ] 2. Measure total time
- [ ] 3. Verify: Total < 50ms

**Expected Result**: < 50ms total

**Actual Result**: _____ ms

**Pass/Fail**: ___________

---

### TC-6.3: Task History Search Performance

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Create 100 task records
- [ ] 2. Search for tags: ["api", "authentication"]
- [ ] 3. Measure search time
- [ ] 4. Verify: Search < 100ms

**Expected Result**: < 100ms

**Actual Result**: _____ ms

**Pass/Fail**: ___________

---

### TC-6.4: Total Selection Overhead

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Measure complete selection flow:
  - [ ] Load agent stats: _____ ms
  - [ ] Search tasks: _____ ms
  - [ ] Score calculation: _____ ms
  - [ ] Selection logic: _____ ms
- [ ] 2. Calculate total overhead
- [ ] 3. Verify: Total < 150ms

**Expected Result**: < 150ms total

**Actual Result**: _____ ms

**Pass/Fail**: ___________

---

### TC-6.5: Memory Update Performance

**Status**: [ ] Not Started [ ] In Progress [ ] Pass [ ] Fail

**Steps**:
- [ ] 1. Measure memory update:
  - [ ] Create task record: _____ ms
  - [ ] Update agent stats: _____ ms
  - [ ] Recalculate trends: _____ ms
- [ ] 2. Calculate total time
- [ ] 3. Verify: Total < 50ms

**Expected Result**: < 50ms

**Actual Result**: _____ ms

**Pass/Fail**: ___________

---

## Post-Test Validation

### Log Validation
- [ ] No critical errors in logs
  ```bash
  grep -i "error" logs/integration-test.log
  ```
- [ ] No unexpected warnings
  ```bash
  grep -i "warning" logs/integration-test.log
  ```
- [ ] All operations logged correctly

### Memory Integrity
- [ ] No orphaned temp files
  ```bash
  find .claude/memory/ -name "*.tmp"
  ```
- [ ] All YAML files valid
  ```bash
  for file in .claude/memory/**/*.yaml; do
    python3 -c "import yaml; yaml.safe_load(open('$file'))"
  done
  ```
- [ ] No data corruption
- [ ] File permissions correct (644 for files, 755 for directories)

### Performance Summary
- [ ] All operations within SLA
- [ ] No memory leaks detected
- [ ] CPU usage acceptable
- [ ] Disk usage acceptable

### Test Report
- [ ] Generate test report
  ```bash
  ./scripts/generate-test-report.sh > INTEGRATION_TEST_REPORT.md
  ```
- [ ] Review all test results
- [ ] Document any issues found
- [ ] Create bug tickets for failures

---

## Summary

### Overall Results

| Scenario | Total Tests | Passed | Failed | Skipped |
|----------|-------------|--------|--------|---------|
| 1. End-to-End Workflow | 3 | ___ | ___ | ___ |
| 2. Agent Selection | 3 | ___ | ___ | ___ |
| 3. ReflectionAgent | 3 | ___ | ___ | ___ |
| 4. Memory Update | 4 | ___ | ___ | ___ |
| 5. Error Handling | 5 | ___ | ___ | ___ |
| 6. Performance | 5 | ___ | ___ | ___ |
| **Total** | **23** | ___ | ___ | ___ |

### Pass Rate: _____ %

### Critical Issues Found
1. _______________
2. _______________
3. _______________

### Recommendations
1. _______________
2. _______________
3. _______________

### Sign-Off

**Tester**: _______________  **Date**: _______________

**Test Lead**: _______________  **Date**: _______________

**Approval**: [ ] Approved [ ] Rejected [ ] Conditional

---

**End of Checklist**
