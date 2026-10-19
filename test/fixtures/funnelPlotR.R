# Regenerates test/fixtures/funnelPlotR.ts: Rscript test/fixtures/funnelPlotR.R
# Expected values evaluate the visual's methods in full precision; FunnelPlotR verifies every quantity it shares,
# and its own outputs are written alongside so the visual is also tested directly against them.
# FunnelPlotR has no equivalent for: 68% limits; RC limits and z-scores (it draws RC limits with the proportion
# SE 1 / (2 sqrt(d)), the visual with the delta-method SE at the target count); overdispersion-adjusted z-scores.

probs <- c(ll99 = 0.001, ll95 = 0.025, ll68 = 0.16, ul68 = 0.84, ul95 = 0.975, ul99 = 0.999)
levels <- c("99", "95", "68")
cases <- list()

transformed_target <- function(chart_type, numerators, denominators) {
  target <- 1
  if (chart_type == "PR") {
    target <- asin(sqrt(sum(numerators) / sum(denominators)))
  } else if (chart_type == "RC") {
    target <- log(sum(numerators)) - log(sum(denominators))
  }
  target
}

transformed_values <- function(chart_type, numerators, denominators) {
  y <- sqrt(numerators / denominators)
  if (chart_type == "PR") {
    y <- asin(sqrt(numerators / denominators))
  } else if (chart_type == "RC") {
    y <- log((numerators + 0.5) / (denominators + 0.5))
  }
  y
}

count_se <- function(numerators, denominators) {
  sqrt(numerators / (numerators + 0.5)^2 + denominators / (denominators + 0.5)^2)
}

observed_se <- function(chart_type, numerators, denominators) {
  se <- 1 / (2 * sqrt(denominators))
  if (chart_type == "RC") {
    se <- count_se(numerators, denominators)
  }
  se
}

# DerSimonian-Laird between-unit variance from 10%/90% winsorised z-scores.
# One unit cannot estimate it: the estimator's denominator is zero, so tau2 is 0 (FunnelPlotR returns NaN or Inf)
dispersion <- function(z, se) {
  bounds <- stats::quantile(z, c(0.1, 0.9), type = 7, names = FALSE)
  phi <- mean(pmin(pmax(z, bounds[1]), bounds[2])^2)
  n <- length(z)
  w <- 1 / se^2
  tau2 <- 0
  if (n > 1 && n * phi >= n - 1) {
    tau2 <- (n * phi - (n - 1)) / (sum(w) - sum(w^2) / sum(w))
  }
  list(phi = phi, tau2 = tau2)
}

# RC plots its limits with counts implied by the target; SR without adjustment uses exact Poisson limits
# Transformed limits are clamped to the transformation's range before transforming back
limit_at <- function(chart_type, denominator, p, target, target_t, tau2, adjusted) {
  q <- stats::qnorm(p)
  if (chart_type == "PR") {
    limit <- sin(min(max(target_t + q * sqrt(1 / (4 * denominator) + tau2), 0), pi / 2))^2
  } else if (chart_type == "RC") {
    limit <- max(exp(target_t + q * sqrt(count_se(target * denominator, denominator)^2 + tau2)), 0)
  } else if (adjusted) {
    limit <- max(1 + q * sqrt(1 / (4 * denominator) + tau2), 0)^2
  } else {
    limit <- max(stats::qchisq(p, 2 * (denominator + (p > 0.5))) / 2 / denominator, 0)
  }
  limit
}

# The visual's grid: 110 equal steps from 1 to the default x-axis upper limit, plus each observed denominator
plotting_denominators <- function(denominators) {
  upper <- max(denominators) * 1.1
  grid <- numeric(0)
  if (upper > 1) {
    grid <- c(1 + (0:109) * ((upper - 1) / 110), upper)
  }
  sort(unique(c(grid, denominators)))
}

# A bound is dropped where it stops narrowing towards the next denominator, and both where they cross
trim_limits <- function(limits) {
  trimmed <- limits
  for (i in seq_len(nrow(limits) - 1)) {
    for (level in levels) {
      lower <- paste0("ll", level)
      upper <- paste0("ul", level)
      low <- limits[i, lower]
      high <- limits[i, upper]
      if (!is.na(low) && !is.na(limits[i + 1, lower]) && low > limits[i + 1, lower]) {
        low <- NA
      }
      if (!is.na(high) && !is.na(limits[i + 1, upper]) && high < limits[i + 1, upper]) {
        high <- NA
      }
      if (!is.na(low) && !is.na(high) && low >= high) {
        low <- NA
        high <- NA
      }
      trimmed[i, lower] <- low
      trimmed[i, upper] <- high
    }
  }
  trimmed
}

# A one-row matrix's columns carry the column name, which would serialise as an object
column <- function(limits, name) {
  as.vector(limits[, name])
}

flags <- function(values, lower, upper) {
  ifelse(!is.na(lower) & values < lower, "lower", ifelse(!is.na(upper) & values > upper, "upper", "none"))
}

funnel <- function(data, chart_type, adjusted, limit = 99) {
  suppressMessages(FunnelPlotR::funnel_plot(data, numerator, denominator, group, data_type = chart_type,
                                            sr_method = "CQC", draw_adjusted = adjusted,
                                            draw_unadjusted = !adjusted, limit = limit))
}

add_case <- function(name, chart_type, od_adjust, keys, numerators, denominators) {
  n <- length(keys)
  target <- 1
  if (chart_type != "SR") {
    target <- sum(numerators) / sum(denominators)
  }
  target_t <- transformed_target(chart_type, numerators, denominators)
  se <- observed_se(chart_type, numerators, denominators)
  uz <- (transformed_values(chart_type, numerators, denominators) - target_t) / se
  spread <- dispersion(uz, se)
  adjusted <- od_adjust == "yes" && spread$tau2 > 0
  tau2 <- ifelse(adjusted, spread$tau2, 0)

  grid <- plotting_denominators(denominators)
  limits <- matrix(NA_real_, length(grid), length(probs), dimnames = list(NULL, names(probs)))
  for (i in seq_along(grid)) {
    for (j in seq_along(probs)) {
      limits[i, j] <- limit_at(chart_type, grid[i], probs[[j]], target, target_t, tau2, adjusted)
    }
  }
  observed <- trim_limits(limits)[match(denominators, grid), , drop = FALSE]

  values <- numerators / denominators
  z <- uz
  if (chart_type == "RC") {
    # Scored like the plotted limits rather than the +0.5 counts that estimate tau2
    z <- (log(values) - target_t) / sqrt(count_se(target * denominators, denominators)^2 + tau2)
  } else if (adjusted) {
    z <- uz * se / sqrt(se^2 + tau2)
  } else if (chart_type == "SR") {
    log_p <- stats::pchisq(values * 2 * denominators, 2 * (denominators + (values > 1)), log.p = TRUE)
    z <- stats::qnorm(log_p, log.p = TRUE)
  }
  two_sigma <- flags(values, column(observed, "ll95"), column(observed, "ul95"))
  three_sigma <- flags(values, column(observed, "ll99"), column(observed, "ul99"))

  data <- data.frame(numerator = numerators, denominator = denominators, group = keys)
  reference <- funnel(data, chart_type, TRUE)
  rows <- match(keys, reference$aggregated_data$group)
  reference_uz <- reference$aggregated_data$Uzscore[rows]
  stopifnot(
    isTRUE(all.equal(reference_uz, uz, tolerance = 1e-12)),
    isTRUE(all.equal(reference$phi, spread$phi, tolerance = 1e-12))
  )
  reference_tau2 <- NA
  if (n > 1) {
    reference_tau2 <- reference$tau2
    stopifnot(
      isTRUE(all.equal(reference_tau2, spread$tau2, tolerance = 1e-12)),
      # FunnelPlotR adjusts when phi > 1 rather than when tau2 > 0; the datasets avoid the band between
      reference$draw_adjusted == (spread$tau2 > 0)
    )
  } else {
    stopifnot(!is.finite(reference$tau2), spread$tau2 == 0)
  }

  # FunnelPlotR rounds its normal quantiles to 7 digits
  reference_limits <- NA
  reference_flags <- NA
  if (chart_type != "RC") {
    shown <- funnel(data, chart_type, adjusted, 95)
    shown99 <- funnel(data, chart_type, adjusted, 99)
    rows <- match(keys, shown$aggregated_data$group)
    rows99 <- match(keys, shown99$aggregated_data$group)
    columns <- c(ll95 = "LCL95", ul95 = "UCL95", ll99 = "LCL99", ul99 = "UCL99")
    if (adjusted) {
      columns <- c(ll95 = "OD95LCL", ul95 = "OD95UCL", ll99 = "OD99LCL", ul99 = "OD99UCL")
    }
    reference_limits <- list()
    for (limit in names(columns)) {
      ours <- column(observed, limit)
      theirs <- shown$aggregated_data[rows, columns[[limit]]]
      reference_limits[[limit]] <- I(theirs)
      if (chart_type == "SR" && adjusted) {
        # FunnelPlotR's CQC limits stay on the square-root scale
        ours <- sqrt(ours)
      }
      # FunnelPlotR's per-unit limits fold back where ours are clamped to the range's edge
      upper_edge <- ifelse(chart_type == "PR", 1, Inf)
      comparable <- !is.na(ours) & ours > 0 & theirs > 0 & ours < upper_edge & theirs < upper_edge
      tolerance <- ifelse(chart_type == "SR" && !adjusted, 1e-12, 1e-6)
      stopifnot(any(comparable), all(abs(ours[comparable] - theirs[comparable]) <= tolerance * pmax(1, abs(theirs[comparable]))))
    }
    if (chart_type == "SR" && adjusted) {
      # FunnelPlotR flags the raw ratio against these square-root-scale limits, so its outlier column is not
      # usable; flagging sqrt(ratio) against its limits must agree with ours instead
      agg <- shown$aggregated_data[rows, ]
      agg99 <- shown99$aggregated_data[rows99, ]
      stopifnot(
        identical((sqrt(values) < agg$OD95LCL | sqrt(values) > agg$OD95UCL), two_sigma != "none"),
        identical((sqrt(values) < agg99$OD99LCL | sqrt(values) > agg99$OD99UCL), three_sigma != "none")
      )
    } else {
      reference_flags <- list(
        two_sigma = I(shown$aggregated_data$outlier[rows] == 1),
        three_sigma = I(shown99$aggregated_data$outlier[rows99] == 1)
      )
      stopifnot(
        identical(unclass(reference_flags$two_sigma), two_sigma != "none"),
        identical(unclass(reference_flags$three_sigma), three_sigma != "none")
      )
    }
  }

  expected <- list(
    target = target,
    tau2 = spread$tau2,
    od_adjusted = adjusted,
    values = I(values),
    z = I(z),
    two_sigma = I(two_sigma),
    three_sigma = I(three_sigma)
  )
  for (limit in names(probs)) {
    expected[[limit]] <- I(column(observed, limit))
  }
  cases[[length(cases) + 1]] <<- list(
    name = name,
    chart_type = chart_type,
    od_adjust = od_adjust,
    keys = I(keys),
    numerators = I(numerators),
    denominators = I(denominators),
    expected = expected,
    funnelPlotR = list(tau2 = reference_tau2, uz = I(reference_uz), limits = reference_limits, outliers = reference_flags)
  )
}

add_both <- function(name, chart_type, keys, numerators, denominators) {
  add_case(paste(name, "unadjusted"), chart_type, "no", keys, numerators, denominators)
  add_case(paste(name, "adjusted"), chart_type, "yes", keys, numerators, denominators)
}

# Insurance claims per policy holder by district, car group and age band: overdispersed
insurance <- MASS::Insurance
insurance_keys <- paste(insurance$District, insurance$Group, insurance$Age)
add_both("insurance claims PR", "PR", insurance_keys, insurance$Claims, insurance$Holders)
add_both("insurance claims RC", "RC", insurance_keys, insurance$Claims, insurance$Holders)

# CABG readmissions and deaths by month, deaths against a logistic age and gender model: not overdispersed
cabg <- qicharts2::cabg
cabg$month <- format(cabg$date, "%Y-%m")
cabg$expected <- stats::fitted(stats::glm(death ~ age + gender, family = stats::binomial, data = cabg))
monthly <- stats::aggregate(cbind(readmission, death, expected, patients = 1) ~ month, data = cabg, FUN = sum)
add_both("cabg readmissions PR", "PR", monthly$month, monthly$readmission, monthly$patients)
add_both("cabg readmissions RC", "RC", monthly$month, monthly$readmission, monthly$patients)
add_both("cabg deaths SR", "SR", monthly$month, monthly$death, monthly$expected)

# Hospital infections against infection-specific rates per bed day, by hospital and infection: overdispersed
infections <- qicharts2::hospital_infections
rates <- tapply(infections$n, infections$infection, sum) / tapply(infections$days, infections$infection, sum)
infections$expected <- infections$days * rates[as.character(infections$infection)]
infections$key <- paste(infections$hospital, infections$infection)
by_unit <- stats::aggregate(cbind(n, expected) ~ key, data = infections, FUN = sum)
add_both("hospital infections SR", "SR", by_unit$key, by_unit$n, by_unit$expected)

# Small groups: one unit gives tau2 = 0 whatever the request; two and three units sit clearly either side of phi = 1
for (chart_type in c("PR", "SR", "RC")) {
  add_both(paste("single unit", chart_type), chart_type, "A", 5, 50)
}
add_both("two units PR overdispersed", "PR", c("A", "B"), c(10, 25), c(200, 200))
add_both("two units SR", "SR", c("A", "B"), c(20, 22), c(20, 20))
add_both("three units RC overdispersed", "RC", c("A", "B", "C"), c(2, 30, 10), c(100, 100, 100))
add_both("three units SR", "SR", c("A", "B", "C"), c(18, 20, 23), c(20, 20, 20))

# Missing limits are null and a zero count's RC or unadjusted SR z-score is -Infinity
json <- jsonlite::toJSON(cases, digits = I(17), auto_unbox = TRUE, na = "string", pretty = TRUE)
json <- gsub("\"NA\"", "null", gsub("\"-Inf\"", "-Infinity", json, fixed = TRUE), fixed = TRUE)
header <- sprintf("// Generated by test/fixtures/funnelPlotR.R, checked against FunnelPlotR %s. Do not edit.\n",
                  utils::packageVersion("FunnelPlotR"))
writeLines(c(header, 'import type { FunnelPlotRCase } from "./funnelPlotRCase";', "",
             paste0("export default ", json, " satisfies FunnelPlotRCase[];")), "test/fixtures/funnelPlotR.ts")
cat(length(cases), "cases written\n")
