## Table `laboratories`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `categories`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `subcategories`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `category_id` | `uuid` |  Nullable |
| `name` | `text` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `dependents`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `account_owner_id` | `uuid` |  Nullable |
| `name` | `text` |  |
| `date_of_birth` | `date` |  Nullable |
| `relationship` | `text` |  Nullable |
| `notes` | `text` |  Nullable |
| `is_active` | `bool` |  Nullable |
| `avatar_url` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `medications`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `dependent_id` | `uuid` |  Nullable |
| `name` | `text` |  |
| `active_ingredient` | `text` |  Nullable |
| `leaflet_url` | `text` |  Nullable |
| `is_controlled` | `bool` |  Nullable |
| `is_continuous_use` | `bool` |  Nullable |
| `laboratory_id` | `uuid` |  Nullable |
| `stock_quantity` | `int4` |  Nullable |
| `stock_last_updated` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `healthcare_professionals`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `dependent_id` | `uuid` |  Nullable |
| `name` | `text` |  |
| `specialty` | `text` |  Nullable |
| `phone` | `text` |  Nullable |
| `email` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `treatments`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `dependent_id` | `uuid` |  Nullable |
| `prescribed_by` | `uuid` |  Nullable |
| `medication_id` | `uuid` |  Nullable |
| `dosage` | `numeric` |  |
| `frequency_hours` | `int4` |  |
| `first_dose_time` | `time` |  Nullable |
| `treatment_goal` | `text` |  Nullable |
| `start_date` | `date` |  |
| `end_date` | `date` |  Nullable |
| `administration_notes` | `text` |  Nullable |
| `replaced_treatment_id` | `uuid` |  Nullable |
| `replaced_by_treatment_id` | `uuid` |  Nullable |
| `is_active` | `bool` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `schedule_type` | `text` |  Nullable |
| `subcategory_id` | `uuid` |  Nullable |
| `is_rescue` | `bool` |  |

## Table `symptoms`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `dependent_id` | `uuid` |  Nullable |
| `description` | `text` |  |
| `severity` | `int4` |  Nullable |
| `start_date` | `date` |  |
| `end_date` | `date` |  Nullable |
| `notes` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `events`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `dependent_id` | `uuid` |  Nullable |
| `description` | `text` |  |
| `event_date` | `date` |  |
| `event_type` | `text` |  Nullable |
| `procedure_goal` | `text` |  Nullable |
| `prescribed_by` | `uuid` |  Nullable |
| `location` | `text` |  Nullable |
| `notes` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `prescriptions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `dependent_id` | `uuid` |  Nullable |
| `prescribed_by` | `uuid` |  Nullable |
| `medication_id` | `uuid` |  Nullable |
| `units` | `int4` |  |
| `expiration_date` | `date` |  Nullable |
| `status` | `text` |  Nullable |
| `used_date` | `date` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `scheduling`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `created_at` | `timestamptz` |  |
| `schedule_time` | `text` |  Nullable |
| `action` | `text` |  Nullable |
| `notes` | `text` |  Nullable |
| `dependent_id` | `uuid` |  Nullable |
| `schedule_date` | `date` |  Nullable |
| `taken_at` | `timestamptz` |  Nullable |

## Table `treatments_in_schedule`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `scheduling_id` | `uuid` |  Nullable |
| `treatment_id` | `uuid` |  Nullable |
| `medication_id` | `uuid` |  Nullable |
| `dosage` | `numeric` |  Nullable |

## Table `medical_procedures`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `created_at` | `timestamptz` |  |
| `dependent_id` | `uuid` |  |
| `prescribed_by` | `uuid` |  Nullable |
| `description` | `text` |  Nullable |
| `date` | `date` |  |
| `time` | `timetz` |  Nullable |

## Table `medication_times_on_treatment`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `treatment_id` | `uuid` |  |
| `day_of_week` | `int4` |  |
| `time` | `time` |  |
| `dosage` | `numeric` |  |
| `created_at` | `timestamptz` |  Nullable |

