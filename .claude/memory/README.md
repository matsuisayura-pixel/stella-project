# AIT42 Long-Term Memory System v1.4.0

## Overview

The AIT42 Memory System enables agents to learn from past executions by recording task history, agent performance metrics, and quality scores. This foundational system allows the Coordinator to make intelligent agent selection decisions based on historical performance data.

## Architecture

```
.claude/memory/
├── config.yaml              # Memory system configuration
├── tasks/                   # Individual task execution records
│   └── YYYY-MM-DD-NNN-description.yaml
├── agents/                  # Per-agent performance statistics
│   └── agent-name-stats.yaml
└── README.md               # This file

.claude/memory-backup/      # Automatic backups
└── archive/                # Rotated old records
```

## File Formats

### Task Record Format

**File naming**: `YYYY-MM-DD-NNN-description.yaml`
- `YYYY-MM-DD`: Date of task execution
- `NNN`: Sequential number (001-999)
- `description`: Brief task description (kebab-case)

**Example**: `2025-11-04-001-api-implementation.yaml`

```yaml
id: "2025-11-04-001"
timestamp: "2025-11-04T14:30:00Z"
request: "Original user request"
task_type: "implementation"  # See config.yaml for valid types

selected_agents:
  - backend-developer
  - api-developer

duration_ms: 45000
success: true
quality_score: 95           # 0-100

errors: []
warnings: []

quality_metrics:
  code_coverage: 92
  documentation_complete: true
  security_review_passed: true
  performance_benchmark: "excellent"

reflection:
  score: 95
  decision: "approved"      # approved | rejected | needs-revision
  feedback: "Detailed feedback from Coordinator"
  improvements: []

artifacts:
  - path: "src/api/auth.rs"
    type: "implementation"

resources:
  tokens_used: 85000
  api_calls: 12
  files_modified: 8

tags:
  - authentication
  - api
```

### Agent Statistics Format

**File naming**: `agent-name-stats.yaml`

```yaml
agent_name: "backend-developer"
total_tasks: 150
successful_tasks: 142
failed_tasks: 8
success_rate: 0.947         # successful_tasks / total_tasks
avg_quality_score: 93.2
avg_duration_ms: 30000
last_updated: "2025-11-04T14:30:00Z"

recent_tasks:
  - id: "2025-11-04-001"
    success: true
    score: 95
  # ... (last 10 tasks)

trends:
  success_rate_trend: 0.05  # Positive = improving
  quality_score_trend: 2.3
  avg_duration_trend: -500  # Negative = faster

specializations:           # Auto-populated
  implementation: 80       # Number of tasks
  bug-fix: 25
  refactoring: 15
```

## Configuration

Edit `.claude/memory/config.yaml` to customize:

| Setting | Default | Description |
|---------|---------|-------------|
| `max_tasks` | 1000 | Max task records before rotation |
| `retention_days` | 90 | Auto-delete tasks older than this |
| `backup_enabled` | true | Enable automatic backups |
| `recent_tasks_limit` | 10 | Tasks to keep in agent stats |

### Quality Thresholds

```yaml
quality_threshold:
  excellent: 90    # Score >= 90
  good: 75         # Score >= 75
  acceptable: 60   # Score >= 60
  poor: 0          # Score < 60
```

### Success Rate Thresholds

```yaml
success_rate_threshold:
  preferred: 0.85    # Prefer agents with >= 85% success
  acceptable: 0.70   # Accept agents with >= 70% success
  warning: 0.50      # Warn if < 50% success
```

## Coordinator Integration

### Before Agent Selection

The Coordinator queries memory to make intelligent agent selections:

```python
# Pseudo-code for Coordinator's decision process

def select_agents(task_description: str, task_type: str) -> List[str]:
    # 1. Find similar past tasks
    similar_tasks = query_tasks(
        task_type=task_type,
        tags=extract_tags(task_description),
        success=True,
        min_quality_score=75
    )

    # 2. Load agent statistics
    agent_stats = {}
    for agent in candidate_agents:
        stats = load_agent_stats(agent)
        agent_stats[agent] = stats

    # 3. Score agents based on:
    #    - Success rate (weight: 40%)
    #    - Average quality score (weight: 30%)
    #    - Specialization in task_type (weight: 20%)
    #    - Recent performance trend (weight: 10%)

    scored_agents = []
    for agent, stats in agent_stats.items():
        score = (
            stats['success_rate'] * 0.4 +
            (stats['avg_quality_score'] / 100) * 0.3 +
            (stats['specializations'].get(task_type, 0) / stats['total_tasks']) * 0.2 +
            normalize_trend(stats['trends']['success_rate_trend']) * 0.1
        )
        scored_agents.append((agent, score))

    # 4. Select top N agents
    scored_agents.sort(key=lambda x: x[1], reverse=True)
    selected = [agent for agent, score in scored_agents[:3]]

    # 5. Log selection rationale
    log_selection_rationale(selected, scored_agents)

    return selected
```

### After Task Completion

The Coordinator updates memory after each task:

```python
# Pseudo-code for memory update

def update_memory(task_result: TaskResult):
    # 1. Create task record
    task_id = generate_task_id()  # "2025-11-04-001"
    task_record = create_task_record(task_result)
    save_task_record(f".claude/memory/tasks/{task_id}-{task_result.description}.yaml", task_record)

    # 2. Update each agent's statistics
    for agent in task_result.agents:
        stats = load_agent_stats(agent)

        # Update counters
        stats['total_tasks'] += 1
        if task_result.success:
            stats['successful_tasks'] += 1
        else:
            stats['failed_tasks'] += 1

        # Recalculate metrics
        stats['success_rate'] = stats['successful_tasks'] / stats['total_tasks']
        stats['avg_quality_score'] = calculate_rolling_average(
            stats['avg_quality_score'],
            task_result.quality_score,
            stats['total_tasks']
        )
        stats['avg_duration_ms'] = calculate_rolling_average(
            stats['avg_duration_ms'],
            task_result.duration_ms,
            stats['total_tasks']
        )

        # Update recent tasks (keep last 10)
        stats['recent_tasks'].insert(0, {
            'id': task_id,
            'success': task_result.success,
            'score': task_result.quality_score
        })
        stats['recent_tasks'] = stats['recent_tasks'][:10]

        # Update specializations
        task_type = task_result.task_type
        stats['specializations'][task_type] = stats['specializations'].get(task_type, 0) + 1

        # Calculate trends (last 30 days)
        stats['trends'] = calculate_trends(agent, days=30)

        stats['last_updated'] = now_iso8601()

        save_agent_stats(agent, stats)

    # 3. Check rotation policy
    check_and_rotate_if_needed()
```

## Querying Memory

### Query Similar Tasks

```bash
# Find successful API implementation tasks
grep -l "task_type: \"implementation\"" .claude/memory/tasks/*.yaml | \
  xargs grep -l "success: true" | \
  xargs grep -l "api"

# Find high-quality tasks (score >= 90)
for file in .claude/memory/tasks/*.yaml; do
  score=$(grep "quality_score:" "$file" | awk '{print $2}')
  if [ "$score" -ge 90 ]; then
    echo "$file: $score"
  fi
done
```

### Query Agent Performance

```bash
# Find top performing agents (success rate >= 85%)
for file in .claude/memory/agents/*-stats.yaml; do
  rate=$(grep "success_rate:" "$file" | awk '{print $2}')
  if (( $(echo "$rate >= 0.85" | bc -l) )); then
    agent=$(basename "$file" -stats.yaml)
    echo "$agent: $rate"
  fi
done

# Find agents specialized in testing
grep -l "test" .claude/memory/agents/*-stats.yaml | \
  xargs grep -A 10 "specializations:"
```

### Query Recent Activity

```bash
# Find tasks from last 7 days
find .claude/memory/tasks/ -name "*.yaml" -mtime -7

# Find recently updated agent stats
find .claude/memory/agents/ -name "*-stats.yaml" -mtime -1
```

## Backup and Restore

### Automatic Backup

Backups are created automatically according to `config.yaml`:

```yaml
backup_enabled: true
backup_interval_days: 7
```

Backups are stored in `.claude/memory-backup/` with timestamp:
```
.claude/memory-backup/
├── 2025-11-04-memory-backup.tar.gz
├── 2025-10-28-memory-backup.tar.gz
└── archive/
    └── ...
```

### Manual Backup

```bash
# Create backup
tar -czf ".claude/memory-backup/manual-backup-$(date +%Y-%m-%d).tar.gz" \
  .claude/memory/

# Restore from backup
tar -xzf .claude/memory-backup/2025-11-04-memory-backup.tar.gz -C .
```

### Backup Strategy

1. **Daily incremental**: Changed files only
2. **Weekly full**: Complete memory snapshot
3. **Monthly archive**: Compress and move to long-term storage
4. **Retention**: Keep daily backups for 30 days, weekly for 90 days

## Rotation Policy

When `max_tasks` is reached (default: 1000):

1. **Archive old tasks**: Tasks older than `retention_days` are compressed
2. **Move to archive**: `memory-backup/archive/YYYY-MM-tasks.tar.gz`
3. **Update indices**: Rebuild task and agent indices
4. **Maintain stats**: Agent statistics are never deleted

```bash
# Manual rotation
cd .claude/memory/tasks
tar -czf "../../memory-backup/archive/$(date +%Y-%m)-tasks.tar.gz" \
  $(find . -name "*.yaml" -mtime +90)
find . -name "*.yaml" -mtime +90 -delete
```

## Data Integrity

### Atomic Writes

All writes use atomic file operations:

```python
# Pseudo-code for atomic write
def atomic_write(file_path: str, content: str):
    temp_path = f"{file_path}.tmp"
    with open(temp_path, 'w') as f:
        f.write(content)
        f.flush()
        os.fsync(f.fileno())
    os.rename(temp_path, file_path)  # Atomic on POSIX
```

### Validation

Before loading YAML files:

1. **Syntax check**: Parse YAML without errors
2. **Schema validation**: Required fields present
3. **Type validation**: Values match expected types
4. **Range validation**: Scores 0-100, dates valid, etc.

```python
# Pseudo-code for validation
def validate_task_record(data: dict):
    required_fields = ['id', 'timestamp', 'request', 'task_type',
                       'selected_agents', 'duration_ms', 'success', 'quality_score']

    for field in required_fields:
        assert field in data, f"Missing required field: {field}"

    assert 0 <= data['quality_score'] <= 100, "Quality score must be 0-100"
    assert data['duration_ms'] > 0, "Duration must be positive"
    assert isinstance(data['selected_agents'], list), "Agents must be list"
```

## Performance Considerations

### File System Limits

- **Max files per directory**: 10,000 (rotate before this)
- **File size**: Keep task records < 10 KB
- **Total size**: Monitor `.claude/memory/` < 100 MB

### Read Performance

```python
# Use caching for frequently accessed stats
cache = {}

def load_agent_stats_cached(agent: str) -> dict:
    if agent not in cache:
        cache[agent] = load_agent_stats(agent)
    return cache[agent]

# Invalidate cache on updates
def save_agent_stats(agent: str, stats: dict):
    atomic_write(f".claude/memory/agents/{agent}-stats.yaml", yaml_dump(stats))
    if agent in cache:
        del cache[agent]
```

### Write Performance

Batch updates when possible:

```python
# Bad: Update each agent separately
for agent in task_result.agents:
    stats = load_agent_stats(agent)
    update_stats(stats, task_result)
    save_agent_stats(agent, stats)

# Good: Load all, update, save all
agent_stats = {agent: load_agent_stats(agent) for agent in task_result.agents}
for agent, stats in agent_stats.items():
    update_stats(stats, task_result)
for agent, stats in agent_stats.items():
    save_agent_stats(agent, stats)
```

## Troubleshooting

### Memory System Not Working

1. **Check permissions**: Ensure `.claude/memory/` is writable
2. **Validate config**: `yamllint .claude/memory/config.yaml`
3. **Check disk space**: `df -h`
4. **Review logs**: Check Coordinator logs for errors

### Corrupted Files

```bash
# Find invalid YAML files
for file in .claude/memory/**/*.yaml; do
  if ! python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
    echo "Invalid YAML: $file"
  fi
done

# Restore from backup
tar -xzf .claude/memory-backup/latest-backup.tar.gz -C .
```

### Agent Stats Not Updating

1. **Check last_updated timestamp**: Should be recent
2. **Verify write permissions**: `ls -la .claude/memory/agents/`
3. **Check for lock files**: Remove `*.lock` files
4. **Review Coordinator logs**: Look for update failures

## Future Enhancements

### Planned for v1.5.0

- [ ] **Graph database integration**: Neo4j for complex queries
- [ ] **ML-based agent selection**: Train model on historical data
- [ ] **Real-time dashboards**: Web UI for memory visualization
- [ ] **Cross-project learning**: Share anonymized patterns
- [ ] **Predictive analytics**: Estimate task duration and success probability

### Planned for v1.6.0

- [ ] **Distributed memory**: Multi-node synchronization
- [ ] **Version control integration**: Link tasks to git commits
- [ ] **Cost tracking**: Monitor token usage and API costs
- [ ] **A/B testing**: Compare different agent combinations

## API Reference

### Memory System API (Future)

```python
from ait42.memory import MemorySystem

# Initialize
memory = MemorySystem(config_path=".claude/memory/config.yaml")

# Query tasks
tasks = memory.query_tasks(
    task_type="implementation",
    success=True,
    min_quality_score=80,
    tags=["api", "authentication"],
    limit=10
)

# Get agent stats
stats = memory.get_agent_stats("backend-developer")

# Record task
memory.record_task(
    request="Implement user authentication",
    task_type="implementation",
    agents=["backend-developer", "security-architect"],
    result=task_result
)

# Get recommendations
recommended_agents = memory.recommend_agents(
    task_description="Fix memory leak in WebSocket handler",
    task_type="bug-fix",
    n=3
)
```

## Examples

### Example 1: Find Best Agent for Bug Fixes

```bash
#!/bin/bash
# find-best-bug-fixer.sh

echo "Top 5 agents for bug fixes:"
echo "================================"

for stats_file in .claude/memory/agents/*-stats.yaml; do
    agent=$(basename "$stats_file" -stats.yaml)
    bug_fix_count=$(grep -A 20 "specializations:" "$stats_file" | grep "bug-fix:" | awk '{print $2}')
    success_rate=$(grep "success_rate:" "$stats_file" | awk '{print $2}')

    if [ -n "$bug_fix_count" ] && [ "$bug_fix_count" -gt 10 ]; then
        score=$(echo "$success_rate * $bug_fix_count" | bc -l)
        echo "$agent: $score (rate: $success_rate, count: $bug_fix_count)"
    fi
done | sort -t: -k2 -rn | head -5
```

### Example 2: Analyze Task Success Patterns

```bash
#!/bin/bash
# analyze-patterns.sh

echo "Task success patterns by type:"
echo "================================"

for task_type in implementation bug-fix deployment testing; do
    total=$(grep -l "task_type: \"$task_type\"" .claude/memory/tasks/*.yaml | wc -l)
    success=$(grep -l "task_type: \"$task_type\"" .claude/memory/tasks/*.yaml | \
              xargs grep -l "success: true" | wc -l)

    if [ "$total" -gt 0 ]; then
        rate=$(echo "scale=2; $success * 100 / $total" | bc)
        echo "$task_type: $rate% ($success/$total)"
    fi
done
```

### Example 3: Generate Performance Report

```bash
#!/bin/bash
# performance-report.sh

cat > performance-report.md <<EOF
# AIT42 Performance Report
**Generated**: $(date)

## Agent Performance Summary

| Agent | Success Rate | Avg Quality | Total Tasks |
|-------|--------------|-------------|-------------|
EOF

for stats_file in .claude/memory/agents/*-stats.yaml; do
    agent=$(basename "$stats_file" -stats.yaml)
    success_rate=$(grep "success_rate:" "$stats_file" | awk '{print $2}')
    avg_quality=$(grep "avg_quality_score:" "$stats_file" | awk '{print $2}')
    total_tasks=$(grep "total_tasks:" "$stats_file" | awk '{print $2}')

    printf "| %-30s | %.1f%% | %.1f | %d |\n" \
        "$agent" \
        "$(echo "$success_rate * 100" | bc -l)" \
        "$avg_quality" \
        "$total_tasks" >> performance-report.md
done

echo "
## Recent Tasks

" >> performance-report.md

ls -t .claude/memory/tasks/*.yaml | head -10 | while read task_file; do
    id=$(grep "^id:" "$task_file" | awk '{print $2}' | tr -d '"')
    request=$(grep "^request:" "$task_file" | cut -d: -f2-)
    success=$(grep "^success:" "$task_file" | awk '{print $2}')

    echo "- **$id**: $request (Success: $success)" >> performance-report.md
done

echo "Report saved to performance-report.md"
```

## Best Practices

1. **Regular backups**: Enable automatic backups in config
2. **Monitor rotation**: Check file counts in `tasks/` directory
3. **Validate quality scores**: Ensure scores are meaningful and consistent
4. **Tag consistently**: Use standard tags for better querying
5. **Review trends**: Analyze agent trends monthly
6. **Clean archives**: Remove old archives after 1 year
7. **Document decisions**: Add detailed feedback in reflections

## Support

For issues or questions about the memory system:

1. Check this README
2. Review `.claude/memory/config.yaml` settings
3. Examine sample task records in `tasks/` directory
4. Contact AIT42 development team

---

**Version**: 1.4.0
**Last Updated**: 2025-11-04
**Maintainer**: AIT42 Memory System
