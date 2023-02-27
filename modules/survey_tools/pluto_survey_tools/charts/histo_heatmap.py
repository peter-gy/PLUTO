import pandas as pd
import altair as alt
from pluto_survey_tools.model import Questionnaire
from pluto_survey_tools.stats.frequencies import score_count_df_keyed


def create_histo_heatmap(q1: Questionnaire, q2: Questionnaire, normalize: bool = True):
    df1 = score_count_df_keyed(q1.questions, normalize=normalize)
    df2 = score_count_df_keyed(q2.questions, normalize=normalize)
    return create_histo_heatmap_from_df(df1, df2, should_layer=q1 != q2)


def create_histo_heatmap_from_df(df1: pd.DataFrame, df2: pd.DataFrame, should_layer: bool):
    domain_x = list(sorted(pd.concat([df1['score_x'], df2['score_x']]).unique()))
    domain_y = list(sorted(pd.concat([df1['score_y'], df2['score_y']]).unique(), reverse=True))

    x_label_expr = "datum.value % 2 ? null : datum.label"
    y_label_expr = "datum.value % 1 ? null : datum.label"
    width_heatmap = 650
    height_heatmap = 650
    size_histogram = 100
    diff_mark_config = {
        "color": "yellow",
        "opacity": 0.25,
    }

    heatmap = alt.Chart(df1).mark_rect().encode(
        x=alt.X('score_x:O',
                title='Benefits',
                sort="ascending",
                axis=alt.Axis(labelExpr=x_label_expr),
                scale=alt.Scale(domain=domain_x)
                ),
        y=alt.Y('score_y:O',
                title='Public value',
                sort="descending",
                axis=alt.Axis(labelExpr=y_label_expr),
                scale=alt.Scale(domain=domain_y)
                ),
        color=alt.Color('count:Q',
                        title='Frequency',
                        scale=alt.Scale(scheme='viridis'),
                        legend=alt.Legend(orient='none', offset=0, legendX=-100, legendY=0)
                        ),
        tooltip=['score_x', 'score_y', 'count']
    ).properties(
        width=width_heatmap,
        height=height_heatmap
    )

    def create_histogram_x(df: pd.DataFrame, is_diff: bool = False):
        mark_config = diff_mark_config if is_diff else {}
        return alt.Chart(df, width=width_heatmap, height=size_histogram).mark_bar(**mark_config).encode(
            x=alt.X('score_x:O',
                    title=None,
                    axis=alt.Axis(labelExpr=x_label_expr),
                    scale=alt.Scale(domain=domain_x),
                    ),
            y=alt.Y('count:Q',
                    title='Frequency',
                    axis=alt.Axis(labels=False)
                    ),
            tooltip=['score_x', 'count']
        )

    def create_histogram_y(df: pd.DataFrame, is_diff: bool = False):
        mark_config = diff_mark_config if is_diff else {}
        return alt.Chart(df, width=size_histogram, height=height_heatmap).mark_bar(**mark_config).encode(
            x=alt.X('count:Q',
                    title='Frequency',
                    axis=alt.Axis(labels=False)
                    ),
            y=alt.Y('score_y:O',
                    title=None,
                    sort="descending",
                    axis=alt.Axis(labelExpr=y_label_expr),
                    scale=alt.Scale(domain=domain_y),
                    ),
            tooltip=['score_y', 'count']
        )

    histX = create_histogram_x(df1)
    histY = create_histogram_y(df1)
    if should_layer:
        histX = histX + create_histogram_x(df2, is_diff=True)
        histY = histY + create_histogram_y(df2, is_diff=True)
    return histX & (heatmap | histY)
